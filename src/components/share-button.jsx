import React from 'react';
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
    const baseUrl = url || window.location.origin;
    const uuid = uuidv4();
    return `${baseUrl}/canvas/${uuid}`;
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
      {/* Share button trigger */}
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      {/* Share dialog content */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share via QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {/* QR Code container with styling */}
          <div className="bg-white/50 backdrop-blur-sm p-8 rounded-xl border shadow-lg">
            <QRCodeSVG
              value={sharingUrl}
              size={256}
              className="h-auto w-full max-w-[256px]"
            />
          </div>

          {/* Copy link button with success state */}
          <Button
            variant={copied ? "success" : "outline"}
            className={`flex gap-2 ${copied ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy Link
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
