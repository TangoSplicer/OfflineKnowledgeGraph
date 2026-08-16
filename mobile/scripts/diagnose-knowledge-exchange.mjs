import ts from "typescript";
import fs from "node:fs";
const path = "app/knowledge-exchange.tsx";
const source = fs.readFileSync(path, "utf8");
const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
for (const diagnostic of file.parseDiagnostics) {
  const start = diagnostic.start ?? 0;
  const line = file.getLineAndCharacterOfPosition(start);
  console.log({ code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "), line: line.line + 1, column: line.character + 1, start, snippet: source.slice(Math.max(0, start - 80), start + 120) });
}
