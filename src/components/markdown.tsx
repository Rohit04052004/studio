
// A simple markdown to HTML converter for text formatting.
export const Markdown = ({ content }: { content: string }) => {
    if (!content) return null;
    
    const htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Process bullet points
      .replace(/^\* (.*$)/gm, '<ul><li class="list-disc list-inside ml-4">$1</li></ul>')
      // Merge consecutive list items into a single list
      .replace(/<\/ul>\n<ul>/g, '')
      // Handle numbered lists
      .replace(/^\d+\. (.*$)/gm, '<ol><li class="list-decimal list-inside ml-4">$1</li></ol>')
      .replace(/<\/ol>\n<ol>/g, '');
  
    return <div className="space-y-2" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };
