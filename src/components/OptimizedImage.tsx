"use client";

import Image, { ImageProps } from "next/image";
import { memo } from "react";
import {
  imageConfigs,
  ImageOptimizationConfig,
} from "@/lib/image-optimization";

interface OptimizedImageProps extends Omit<ImageProps, "alt"> {
  alt: string;
  variant?: keyof typeof imageConfigs;
  config?: ImageOptimizationConfig;
}

/**
 * Optimized Image component with lazy loading, responsive sizing, and WebP support.
 * Memoized to prevent unnecessary re-renders.
 */
const OptimizedImage = memo(function OptimizedImage({
  variant = "card",
  config,
  ...props
}: OptimizedImageProps) {
  const mergedConfig = {
    ...imageConfigs[variant],
    ...config,
  };

  return (
    <Image
      {...props}
      alt={props.alt}
      sizes={mergedConfig.sizes}
      quality={mergedConfig.quality}
      placeholder={mergedConfig.placeholder}
      priority={mergedConfig.priority}
      loading={mergedConfig.priority ? "eager" : "lazy"}
    />
  );
});

export default OptimizedImage;
