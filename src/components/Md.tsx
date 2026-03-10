import React from "react";
import { parseMarkdown } from "@/lib/mdParser";
import Inline from "./Inline";

interface MdProps {
  content: string;
}

function Heading({
  level,
  className,
  children,
}: {
  level: number;
  className: string;
  children: React.ReactNode;
}) {
  switch (level) {
    case 1:
      return <h1 className={className}>{children}</h1>;
    case 2:
      return <h2 className={className}>{children}</h2>;
    case 3:
      return <h3 className={className}>{children}</h3>;
    default:
      return <h4 className={className}>{children}</h4>;
  }
}

export default function Md({ content }: MdProps) {
  const tokens = parseMarkdown(content);

  return (
    <div className="space-y-3">
      {tokens.map((token, i) => {
        switch (token.type) {
          case "heading": {
            const sizes: Record<number, string> = {
              1: "text-2xl font-bold",
              2: "text-xl font-bold",
              3: "text-lg font-semibold",
              4: "text-base font-semibold",
            };
            return (
              <Heading
                key={i}
                level={token.level}
                className={`font-serif text-st-dark ${sizes[token.level] || sizes[4]} mt-4 mb-2`}
              >
                <Inline text={token.text} />
              </Heading>
            );
          }

          case "paragraph":
            return (
              <p key={i} className="text-sm leading-relaxed text-st-dark/85">
                {token.text.split("\n").map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    <Inline text={line} />
                  </span>
                ))}
              </p>
            );

          case "list":
            return (
              <ul key={i} className="list-disc pl-6 space-y-1">
                {token.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-sm leading-relaxed text-st-dark/85"
                  >
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );

          case "orderedList":
            return (
              <ol key={i} className="list-decimal pl-6 space-y-1">
                {token.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-sm leading-relaxed text-st-dark/85"
                  >
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            );

          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-st-gold pl-4 italic text-sm text-st-dark/70"
              >
                <Inline text={token.text} />
              </blockquote>
            );

          case "codeBlock":
            return (
              <pre
                key={i}
                className="bg-st-dark text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono"
              >
                {token.text}
              </pre>
            );

          case "hr":
            return <hr key={i} className="border-st-border my-4" />;

          case "labelValue":
            return (
              <p key={i} className="text-sm leading-relaxed">
                <strong className="font-bold text-st-dark">
                  {token.label}:
                </strong>{" "}
                <span className="text-st-dark/80">
                  <Inline text={token.value} />
                </span>
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
