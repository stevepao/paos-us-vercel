import Image from "next/image";
import type { WordPressPost } from "@/lib/wordpress";

type PostFeaturedImageProps = {
  post: WordPressPost;
};

export function PostFeaturedImage({ post }: PostFeaturedImageProps) {
  const image = post.featuredImage?.node;

  if (!image?.sourceUrl) {
    return null;
  }

  return (
    <figure className="featured-image">
      <Image
        alt={image.altText ?? ""}
        height={image.mediaDetails?.height ?? 630}
        src={image.sourceUrl}
        width={image.mediaDetails?.width ?? 1200}
      />
    </figure>
  );
}
