// Entry program for make.fun's "Promote make.fun's make-your-own-bounty
// post on X" bounty (post-x-promote-make-your-own-bounty-01), Node 22,
// standard library only.
//
// The entry itself is one public post on X that quotes make.fun's
// make-your-own-bounty announcement. This repository names that post in
// POST.json at its root, and this program's whole job is to hand the post
// file to the grader: it reads POST.json from the repository, checks that
// the address it carries really is the address of one X post, prints what
// it found, and copies the file to the output directory.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for the repository mount and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const POST_FILE = join(BOT_DIR, 'POST.json');

// One X post's address: https://x.com/<handle>/status/<digits>, with the
// same shape allowed on twitter.com. Anything else is not a post the
// house can read, so the program refuses it instead of handing it in.
const POST_URL_PATTERN =
  /^https:\/\/(?:www\.|mobile\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d+)(?:[/?#].*)?$/;

function readPost(): { url: string; handle: string; id: string } {
  let raw: string;
  try {
    raw = readFileSync(POST_FILE, 'utf8');
  } catch (err) {
    console.error(`POST.json could not be read from ${POST_FILE}: ${(err as Error).message}`);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('POST.json is not valid JSON.');
    process.exit(1);
  }

  const url = (parsed as { url?: unknown })?.url;
  if (typeof url !== 'string') {
    console.error('POST.json must be a JSON object with a "url" string.');
    process.exit(1);
  }

  const match = POST_URL_PATTERN.exec(url.trim());
  if (!match) {
    console.error(`POST.json url is not an X post address: ${url}`);
    process.exit(1);
  }
  return { url: url.trim(), handle: match[1], id: match[2] };
}

const post = readPost();
console.log(`Entry post: ${post.url}`);
console.log(`Posted by @${post.handle}, post id ${post.id}.`);

mkdirSync(OUTPUT_DIR, { recursive: true });
const target = join(OUTPUT_DIR, 'POST.json');
copyFileSync(POST_FILE, target);

// Read the copy back and make sure the grader will see the same post this
// program just validated: a truncated or mangled copy would name no post
// at all, and the entry would be graded invalid through no fault of the
// post itself.
const copied = JSON.parse(readFileSync(target, 'utf8')) as { url?: unknown };
if (copied.url !== post.url) {
  console.error(`Copied POST.json does not name the entry post: ${String(copied.url)}`);
  process.exit(1);
}
console.log(`POST.json copied to ${target} and verified.`);
