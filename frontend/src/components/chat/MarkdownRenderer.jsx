import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }) {
  return (
    <div
      className="
      max-w-none
      text-gray-900

      [&>p]:mb-4
      [&>p]:leading-7

      [&>h1]:text-2xl
      [&>h1]:font-bold
      [&>h1]:mt-6
      [&>h1]:mb-3

      [&>h2]:text-xl
      [&>h2]:font-bold
      [&>h2]:mt-6
      [&>h2]:mb-3

      [&>h3]:text-lg
      [&>h3]:font-semibold
      [&>h3]:mt-5
      [&>h3]:mb-2

      [&>ul]:list-disc
      [&>ul]:ml-6
      [&>ul]:mb-4

      [&>ol]:list-decimal
      [&>ol]:ml-6
      [&>ol]:mb-4

      [&>li]:mb-2

      [&>strong]:font-semibold

      [&>blockquote]:border-l-4
      [&>blockquote]:border-green-500
      [&>blockquote]:pl-4
      [&>blockquote]:italic
      [&>blockquote]:text-gray-600

      [&>table]:w-full
      [&>table]:border-collapse
      [&>table]:my-5

      [&_th]:border
      [&_th]:border-gray-300
      [&_th]:bg-gray-100
      [&_th]:px-4
      [&_th]:py-2
      [&_th]:text-left

      [&_td]:border
      [&_td]:border-gray-300
      [&_td]:px-4
      [&_td]:py-2

      [&_code]:bg-gray-100
      [&_code]:rounded
      [&_code]:px-1
      [&_code]:py-0.5

      [&_pre]:bg-gray-900
      [&_pre]:text-white
      [&_pre]:rounded-xl
      [&_pre]:p-5
      [&_pre]:overflow-x-auto
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="
              text-green-700
              underline
              hover:text-green-900
              "
            >
              {children}
            </a>
          ),

          code: ({ children, inline }) =>
            inline ? (
              <code>{children}</code>
            ) : (
              <pre>
                <code>{children}</code>
              </pre>
            ),
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
