// import React from 'react';
import PropTypes from 'prop-types';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share, Copy, Check } from "lucide-react";
import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * ShareButton Component
 * Provides a dialog with QR code and copy link functionality for sharing URLs
 * Generates a unique UUID for each share instance
 * @param {string} url - Base URL to share. Falls back to current window location
 */
const ShareButton = ({ url }) => {
  // Track the copied state for button feedback
  const [copied, setCopied] = useState(false);

  // Generate a unique sharing URL with UUID
  // Using useMemo to keep the same UUID during re-renders
  const sharingUrl = useMemo(() => {
    if (!url) {
      const uuid = uuidv4();
      return `${window.location.origin}/canvas/${uuid}`;
    } else {
      return url;
    }
  }, [url]);

  /**
   * Handles copying the unique sharing URL to clipboard and shows feedback
   * Reverts button state after 2 seconds
   */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(sharingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      {/* Share button trigger - made touch-friendly */}
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] lg:min-w-[48px] lg:min-h-[48px]
            text-primary hover:text-primary-foreground hover:bg-primary
            border-2 hover:border-primary z-50"
        >
          <Share className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
        </Button>
      </DialogTrigger>

      {/* Responsive dialog content */}
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl p-3 sm:p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-center">
            Share via QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6">
          {/* Responsive QR Code container */}
          <div className="bg-white/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl border shadow-lg w-full max-w-[240px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[360px] mx-auto">
            <QRCodeSVG
              value={sharingUrl}
              size={256}
              className="h-auto w-full"
            />
          </div>

          {/* Full-width button on mobile, auto on larger screens */}
          <Button
            variant={copied ? "success" : "outline"}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 min-h-[40px] sm:min-h-[44px] ${
              copied ? "bg-green-500 hover:bg-green-600 text-white" : "text-foreground"
            }`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-sm md:text-base">Copy Link</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// PropTypes validation
ShareButton.propTypes = {
  url: PropTypes.string
};

export default ShareButton;
