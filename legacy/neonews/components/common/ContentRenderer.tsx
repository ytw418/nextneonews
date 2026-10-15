import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ContentRendererProps {
  content: string | null;
}

export const ContentRenderer = ({ content }: ContentRendererProps) => {
  if (!content) return null;

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ node, ...props }) => (
            <div className="my-4 relative w-full">
              <img
                {...props}
                className="rounded-lg object-cover mx-auto"
                style={{ maxHeight: "500px" }}
                alt={props.alt || ""}
              />
            </div>
          ),
          p: ({ node, ...props }) => (
            <p className="my-4 whitespace-pre-wrap" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
