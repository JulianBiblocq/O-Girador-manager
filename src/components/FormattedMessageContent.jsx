import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

/**
 * FormattedMessageContent Component
 * - Parses YouTube, Vimeo, Dailymotion video URLs and converts them into responsive embed iframes
 * - Sanitizes raw HTML using DOMPurify to prevent XSS attacks while allowing safe tags (iframe, img, a, formatting)
 */
export default function FormattedMessageContent({ content, className = '' }) {
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

  return (
    <div 
      className={`prose dark:prose-invert max-w-none text-xs leading-relaxed font-semibold text-left break-words overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
