"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface HelpTopic {
  id: string;
  title: string;
  content: string;
  keywords?: string[];
}

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: HelpTopic[];
}

export function HelpModal({ isOpen, onClose, topics }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const filteredTopics = topics.filter((topic) => {
    const query = searchQuery.toLowerCase();
    return (
      topic.title.toLowerCase().includes(query) ||
      topic.content.toLowerCase().includes(query) ||
      topic.keywords?.some((kw) => kw.toLowerCase().includes(query))
    );
  });

  const activeTopic = selectedTopic
    ? topics.find((t) => t.id === selectedTopic)
    : null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="bg-[#111111] border border-[#333333] rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333]">
          <h2
            id="help-modal-title"
            className="text-lg font-semibold text-white"
          >
            Help & Documentation
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "text-[#777777] hover:text-white transition-colors",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]"
            )}
            aria-label="Close help modal"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Search and topics list */}
          <div className="w-full md:w-1/3 border-r border-[#333333] flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-[#333333]">
              <input
                type="text"
                placeholder="Search help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full bg-[#0a0a0a] border border-[#333333] px-3 py-2 text-sm text-white",
                  "placeholder-[#555555] rounded",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]"
                )}
              />
            </div>

            {/* Topics list */}
            <div className="flex-1 overflow-y-auto">
              {filteredTopics.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#777777]">
                  No topics found
                </div>
              ) : (
                filteredTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-[#222222] transition-colors",
                      "hover:bg-[#1a1a1a] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a962]",
                      selectedTopic === topic.id
                        ? "bg-[#1a1a1a] text-[#c9a962]"
                        : "text-[#aaaaaa]"
                    )}
                  >
                    <div className="text-sm font-medium">{topic.title}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Topic content */}
          <div className="hidden md:flex flex-1 flex-col overflow-hidden">
            {activeTopic ? (
              <>
                <div className="px-6 py-4 border-b border-[#333333]">
                  <h3 className="text-base font-semibold text-white">
                    {activeTopic.title}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <p className="text-sm text-[#aaaaaa] whitespace-pre-wrap">
                    {activeTopic.content}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[#777777]">
                <p className="text-sm">Select a topic to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile topic content */}
        {activeTopic && (
          <div className="md:hidden border-t border-[#333333] p-4 max-h-48 overflow-y-auto">
            <p className="text-sm text-[#aaaaaa] whitespace-pre-wrap">
              {activeTopic.content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
