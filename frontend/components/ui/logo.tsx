"use client";

import React from "react";
import { AdaptFlowLogo as BaseAdaptFlowLogo, AdaptFlowLogoProps as BaseProps, LogoSize } from "./AdaptFlowLogo";

export interface LogoProps extends Omit<BaseProps, "size" | "tagline"> {
  size?: LogoSize;
  subtitle?: string;
  tagline?: string;
}

export function AdaptFlowLogo({
  subtitle,
  tagline,
  ...props
}: LogoProps) {
  return (
    <BaseAdaptFlowLogo
      tagline={tagline || subtitle}
      {...props}
    />
  );
}

export default AdaptFlowLogo;
