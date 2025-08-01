'use client';

import React, { useState, useEffect } from 'react';
import { SongWithRating } from '@/app/types';
import { generateRatingChart } from '@/app/utils/clientImageGenerator';

interface ExportButtonProps {
  newSongs: SongWithRating[];
  oldSongs: SongWithRating[];
  coverArtMap: Record<string, string>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ newSongs, oldSongs, coverArtMap }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');

  // Auto-generate image when data is available
  useEffect(() => {
    const generateImage = async () => {
      // Only generate if we have actual data and haven't generated yet
      if (!newSongs?.length && !oldSongs?.length) return;
      if (generatedImageUrl) return; // Already generated
      if (isGenerating) return; // Currently generating

      // Wait for cover art map to be populated (if we have songs but no cover art map yet)
      const hasSongs = (newSongs?.length || 0) + (oldSongs?.length || 0) > 0;
      const hasCoverArtMap = Object.keys(coverArtMap || {}).length > 0;

      if (hasSongs && !hasCoverArtMap) {
        setProgressMessage('Waiting for cover art database...');
        return; // Wait for cover art map to be ready
      }

      try {
        setIsGenerating(true);
        setError(null);
        setProgressMessage('Starting image generation...');

        // Defensive checks for props
        const safeNewSongs = newSongs || [];
        const safeOldSongs = oldSongs || [];
        const safeCoverArtMap = coverArtMap || {};

        // Generate the image using client-side canvas with progress callback
        const dataUrl = await generateRatingChart(
          safeNewSongs,
          safeOldSongs,
          safeCoverArtMap,
          (status: string) => {
            setProgressMessage(status);
          },
        );
        setGeneratedImageUrl(dataUrl);
        setProgressMessage('');
      } catch (err) {
        console.error('❌ Image generation failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate image');
        setProgressMessage('');
      } finally {
        setIsGenerating(false);
      }
    };

    generateImage();
  }, [newSongs, oldSongs, coverArtMap, generatedImageUrl, isGenerating]);

  const handleSaveImage = () => {
    if (!generatedImageUrl) return;

    // Create a download link
    const link = document.createElement('a');
    link.download = `maimai-dx-rating-chart-${new Date().toISOString().split('T')[0]}.png`;
    link.href = generatedImageUrl;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('💾 Image saved successfully');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Generated Image Preview */}
      {generatedImageUrl && (
        <div className="mb-4 overflow-hidden rounded-lg shadow-lg">
          <img src={generatedImageUrl} alt="Generated Rating Chart" className="h-auto max-w-full" />
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveImage}
        disabled={!generatedImageUrl || isGenerating}
        className={`rounded-lg px-6 py-3 font-semibold text-white transition-all duration-200 ${
          !generatedImageUrl || isGenerating
            ? 'cursor-not-allowed bg-gray-400'
            : 'bg-gradient-to-r from-green-500 to-blue-600 shadow-lg hover:scale-105 hover:from-green-600 hover:to-blue-700 hover:shadow-xl'
        } `}
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Generating Image...
          </div>
        ) : generatedImageUrl ? (
          <div className="flex items-center gap-2">💾 Save Rating Chart</div>
        ) : (
          <div className="flex items-center gap-2">📷 Waiting for Data...</div>
        )}
      </button>

      {error && (
        <div className="max-w-md text-center text-sm text-red-500">
          <p className="font-semibold">Generation Failed:</p>
          <p>{error}</p>
        </div>
      )}

      {isGenerating && (
        <p className="max-w-md text-center text-sm text-blue-600">
          🎨 Generating your rating chart...
        </p>
      )}

      {generatedImageUrl && !isGenerating && !error && (
        <p className="max-w-md text-center text-sm text-green-600">
          ✅ Rating chart ready! Click to save as PNG
        </p>
      )}

      {!generatedImageUrl && !isGenerating && !error && (
        <p className="max-w-md text-center text-sm text-gray-600">
          Upload your song data to automatically generate your rating chart
        </p>
      )}

      {/* Progress Message */}
      {progressMessage && (
        <p className="max-w-md text-center text-sm text-blue-500">{progressMessage}</p>
      )}
    </div>
  );
};
