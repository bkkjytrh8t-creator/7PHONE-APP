'use client';

import {useState} from 'react';

export function ProductLikeButton({
  productId: _productId,
  initialLikes,
  label
}: {
  productId: number;
  initialLikes: number;
  label: string;
}) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);

  function toggleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((current) => current + (nextLiked ? 1 : -1));
  }

  return (
    <button
      aria-label={label}
      aria-pressed={liked}
      className={`absolute end-2.5 top-2.5 z-10 inline-flex h-8 min-w-12 items-center justify-center gap-1 rounded-lg px-2 text-xs font-black shadow-sm transition ${
        liked
          ? 'bg-brand-neon text-white'
          : 'bg-white/95 text-brand-pink hover:bg-brand-neon hover:text-white'
      }`}
      onClick={toggleLike}
      type="button"
    >
      <span aria-hidden>{liked ? '♥' : '♡'}</span>
      <span>{likes}</span>
    </button>
  );
}
