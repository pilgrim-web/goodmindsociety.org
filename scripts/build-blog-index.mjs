import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.resolve(__dirname, "../content/blog");
const OUTPUT_PATH = path.resolve(__dirname, "../public/blog/index.json");
const LANGS = ["en", "ko", "es", "zh"];

const ensureDir = async (filepath) => {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
};

const parseScalar = (raw) => {
  let value = raw.trim();
  if (!value) return "";

  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return value;
};

const parseYamlLike = (source) => {
  const lines = source.replace(/\r/g, "").split("\n");
  const root = {};
  const stack = [{ indent: -1, obj: root }];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      i += 1;
      continue;
    }

    const indent = line.match(/^\s*/)[0].length;

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const ctx = stack[stack.length - 1].obj;
    const kv = trimmed.match(/^([A-Za-z0-9_.-]+):(?:\s*(.*))?$/);

    if (!kv) {
      i += 1;
      continue;
    }

    const key = kv[1];
    const rest = kv[2] ?? "";

    if (rest === "") {
      const child = {};
      ctx[key] = child;
      stack.push({ indent, obj: child });
      i += 1;
      continue;
    }

    if (rest === "|" || rest === "|-" || rest === ">" || rest === ">-") {
      const folded = rest.startsWith(">");
      const block = [];
      i += 1;

      while (i < lines.length) {
        const blockLine = lines[i];
        const blockTrimmed = blockLine.trim();
        const blockIndent = blockLine.match(/^\s*/)[0].length;

        if (blockTrimmed !== "" && blockIndent <= indent) {
          break;
        }

        if (blockTrimmed === "") {
          block.push("");
          i += 1;
          continue;
        }

        block.push(blockLine.slice(Math.min(blockLine.length, indent + 2)));
        i += 1;
      }

      let value = block.join("\n");
      if (folded) {
        value = value.replace(/\n+/g, "\n");
      }

      ctx[key] = value.trim();
      continue;
    }

    ctx[key] = parseScalar(rest);
    i += 1;
  }

  return root;
};

const parseMarkdownFile = async (filepath) => {
  const raw = await fs.readFile(filepath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`Missing frontmatter in ${path.basename(filepath)}`);
  }

  const frontmatter = parseYamlLike(match[1]);
  const markdownBody = match[2].trim();
  return { frontmatter, markdownBody };
};

const toMultilang = (value, fallback = "") => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out = {};
    for (const lang of LANGS) {
      out[lang] = String(value[lang] ?? value.en ?? fallback ?? "").trim();
    }
    return out;
  }

  const scalar = String(value ?? fallback ?? "").trim();
  const out = {};
  for (const lang of LANGS) {
    out[lang] = scalar;
  }
  return out;
};

const toISODate = (input) => {
  const text = String(input || "").trim();
  if (!text) return "";
  return text.slice(0, 10);
};

const byDateDesc = (a, b) => {
  const aTime = Date.parse(a.date || "1970-01-01");
  const bTime = Date.parse(b.date || "1970-01-01");
  return bTime - aTime;
};

const build = async () => {
  let files = [];

  try {
    const all = await fs.readdir(CONTENT_DIR);
    files = all.filter((name) => name.endsWith(".md"));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      files = [];
    } else {
      throw error;
    }
  }

  const posts = [];

  for (const filename of files) {
    const filepath = path.join(CONTENT_DIR, filename);
    const { frontmatter, markdownBody } = await parseMarkdownFile(filepath);

    const baseSlug = filename.replace(/\.md$/, "");
    const slug = String(frontmatter.slug || baseSlug).trim();
    const date = toISODate(frontmatter.date);

    posts.push({
      slug,
      date,
      title: toMultilang(frontmatter.title, slug),
      excerpt: toMultilang(frontmatter.excerpt, ""),
      body: toMultilang(frontmatter.body, markdownBody),
    });
  }

  posts.sort(byDateDesc);

  const payload = {
    generatedAt: new Date().toISOString(),
    posts,
  };

  await ensureDir(OUTPUT_PATH);
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Built blog index with ${posts.length} post(s): ${OUTPUT_PATH}`);
};

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
