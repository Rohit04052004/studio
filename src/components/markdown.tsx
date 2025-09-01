// A simple markdown to HTML converter for text formatting.
export const Markdown = ({ content }: { content: string }) => {
    const htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/^\* (.*$)/gm, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>')
      .replace(/<\/ul>\n<ul/g, ''); // Merge consecutive lists
  
    return <div className="space-y-2" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };
  