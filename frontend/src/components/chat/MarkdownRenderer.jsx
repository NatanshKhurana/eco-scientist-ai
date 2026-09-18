import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }) {
  const safeContent = content || "";

  return (
    <div
      className="
      prose
      prose-sm
      max-w-none
      prose-headings:font-semibold
      prose-h2:text-lg
      prose-h3:text-base
      prose-p:leading-7
      prose-li:my-1
      prose-strong:font-semibold
      prose-table:border-collapse
      prose-th:border
      prose-th:border-gray-200
      prose-th:bg-gray-50
      prose-th:px-3
      prose-th:py-2
      prose-td:border
      prose-td:border-gray-200
      prose-td:px-3
      prose-td:py-2
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="
              text-green-700
              underline
              "
            />
          ),

          blockquote: ({ children }) => (
            <blockquote
              className="
              border-l-4
              border-green-500
              pl-4
              italic
              text-gray-600
              "
            >
              {children}
            </blockquote>
          ),

          code: ({ inline, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="
                  bg-gray-100
                  px-1.5
                  py-0.5
                  rounded
                  text-sm
                  "
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre
                className="
                bg-gray-900
                text-gray-100
                rounded-xl
                p-4
                overflow-x-auto
                "
              >
                <code>{children}</code>
              </pre>
            );
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
