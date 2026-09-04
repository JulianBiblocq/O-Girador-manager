import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';

/**
 * FormattedMessageContent Component
 * - Parses YouTube, Vimeo, Dailymotion video URLs and converts them into responsive embed iframes
 * - Sanitizes raw HTML using DOMPurify to empcher XSS attacks while allowing safe tags (iframe, img, a, formatting)
 */
export default function FormattedMessageContent({ content, className = '' }) {
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const sanitizedContent = useMemo(() => {
    if (!content) return '';

    let html = content;

    // Convert plain text newlines to <br/> if content does not contain HTML tags
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(html);
    if (!hasHtmlTags) {
      html = html.replace(/\n/g, '<br/>');
    }

    // Process YouTube URLs (watch?v=, youtu.be/, embed/, shorts/)
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/gi;
    html = html.replace(youtubeRegex, (match, videoId) => {
      return `<div class="my-2.5 w-full max-w-lg aspect-video rounded-md overflow-hidden border border-encre-noire/20 shadow-[2px_2px_0px_0px_rgba(24,23,22,0.15)] bg-black">
        <iframe 
          src="https://www.youtube.com/embed/${videoId}" 
          class="w-full h-full border-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
    });

    // Process Vimeo URLs (vimeo.com/VIDEO_ID)
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)(?:[^\s]*)/gi;
    html = html.replace(vimeoRegex, (match, videoId) => {
      return `<div class="my-2.5 w-full max-w-lg aspect-video rounded-md overflow-hidden border border-encre-noire/20 shadow-[2px_2px_0px_0px_rgba(24,23,22,0.15)] bg-black">
        <iframe 
          src="https://player.vimeo.com/video/${videoId}" 
          class="w-full h-full border-0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
    });

    // Process Dailymotion URLs (dailymotion.com/video/VIDEO_ID)
    const dailymotionRegex = /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)(?:[^\s]*)/gi;
    html = html.replace(dailymotionRegex, (match, videoId) => {
      return `<div class="my-2.5 w-full max-w-lg aspect-video rounded-md overflow-hidden border border-encre-noire/20 shadow-[2px_2px_0px_0px_rgba(24,23,22,0.15)] bg-black">
        <iframe 
          src="https://www.dailymotion.com/embed/video/${videoId}" 
          class="w-full h-full border-0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
    });

    // Sanitize with DOMPurify
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe', 'img'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height', 'target', 'rel', 'class', 'style', 'alt', 'loading'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
  }, [content]);

  const handleContainerClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setFullscreenImage({ src: e.target.src, alt: e.target.alt || 'Image agrandie' });
    }
  };

  return (
    <>
      <div 
        className={`prose dark:prose-invert max-w-none text-xs leading-relaxed font-semibold text-left break-words overflow-hidden ${className} [&_img]:max-w-[140px] [&_img]:max-h-[140px] [&_img]:object-cover [&_img]:cursor-zoom-in [&_img]:hover:opacity-80 [&_img]:transition-opacity [&_img]:rounded-md [&_img]:shadow-sm [&_img]:border-2 [&_img]:border-encre-noire/20 [&_img]:my-2`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        onClick={handleContainerClick}
      />

      {fullscreenImage && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out select-none animate-fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            type="button"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full text-2xl font-bold cursor-pointer transition-colors backdrop-blur-md"
            onClick={() => setFullscreenImage(null)}
            title="Fermer"
          >
            ✕
          </button>
          <img 
            src={fullscreenImage.src} 
            alt={fullscreenImage.alt} 
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-md shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>,
        document.body
      )}
    </>
  );
}
