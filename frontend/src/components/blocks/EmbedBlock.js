import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  ExternalLinkIcon, 
  PlayIcon, 
  FileIcon,
  ImageIcon,
  LinkIcon
} from 'lucide-react';

const EmbedBlock = ({ block, onChange, canEdit }) => {
  const [isEditing, setIsEditing] = useState(!block.content);
  const [url, setUrl] = useState(block.content || '');
  const [embedType, setEmbedType] = useState(block.properties?.embedType || 'auto');
  const [loading, setLoading] = useState(false);

  const detectEmbedType = (url) => {
    if (!url) return 'link';
    
    // YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      return 'youtube';
    }
    
    // Figma
    if (url.includes('figma.com/')) {
      return 'figma';
    }
    
    // Google Maps
    if (url.includes('google.com/maps') || url.includes('maps.google.com')) {
      return 'maps';
    }
    
    // Codepen
    if (url.includes('codepen.io/')) {
      return 'codepen';
    }
    
    // GitHub
    if (url.includes('github.com/')) {
      return 'github';
    }
    
    // Twitter/X
    if (url.includes('twitter.com/') || url.includes('x.com/')) {
      return 'twitter';
    }
    
    // Generic iframe
    return 'iframe';
  };

  const getEmbedUrl = (originalUrl, type) => {
    switch (type) {
      case 'youtube':
        const youtubeId = originalUrl.includes('youtu.be/') 
          ? originalUrl.split('youtu.be/')[1]?.split('?')[0]
          : originalUrl.split('v=')[1]?.split('&')[0];
        return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : originalUrl;
      
      case 'figma':
        if (originalUrl.includes('figma.com/file/')) {
          const baseUrl = originalUrl.split('?')[0];
          return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(baseUrl)}`;
        }
        return originalUrl;
      
      case 'codepen':
        return originalUrl.replace('/pen/', '/embed/');
      
      default:
        return originalUrl;
    }
  };

  const handleSave = () => {
    const detectedType = embedType === 'auto' ? detectEmbedType(url) : embedType;
    onChange(url, { embedType: detectedType });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setUrl(block.content || '');
    setIsEditing(false);
  };

  const renderEmbed = () => {
    if (!block.content) return null;

    const type = block.properties?.embedType || detectEmbedType(block.content);
    const embedUrl = getEmbedUrl(block.content, type);

    switch (type) {
      case 'youtube':
        return (
          <div className="relative aspect-video w-full">
            <iframe
              src={embedUrl}
              title="YouTube video"
              className="absolute inset-0 w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'figma':
        return (
          <div className="relative w-full h-96">
            <iframe
              src={embedUrl}
              title="Figma design"
              className="absolute inset-0 w-full h-full rounded-lg border border-gray-200"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );

      case 'maps':
        return (
          <div className="relative w-full h-64">
            <iframe
              src={embedUrl}
              title="Google Maps"
              className="absolute inset-0 w-full h-full rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );

      case 'codepen':
        return (
          <div className="relative w-full h-96">
            <iframe
              src={embedUrl}
              title="CodePen"
              className="absolute inset-0 w-full h-full rounded-lg"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );

      case 'iframe':
        return (
          <div className="relative w-full h-96">
            <iframe
              src={embedUrl}
              title="Embedded content"
              className="absolute inset-0 w-full h-full rounded-lg border border-gray-200"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        );

      case 'github':
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <FileIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">GitHub Repository</span>
            </div>
            <a 
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              {block.content}
            </a>
          </div>
        );

      default:
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <LinkIcon className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Link Preview</span>
            </div>
            <a 
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center space-x-1"
            >
              <span>{block.content}</span>
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
          </div>
        );
    }
  };

  if (isEditing && canEdit) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Embed URL
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a link to embed content..."
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Embed Type
            </label>
            <Select value={embedType} onValueChange={setEmbedType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="figma">Figma</SelectItem>
                <SelectItem value="codepen">CodePen</SelectItem>
                <SelectItem value="maps">Google Maps</SelectItem>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="iframe">Generic iframe</SelectItem>
                <SelectItem value="link">Link preview</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={!url.trim()}>
              Embed
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!block.content) {
    return (
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => canEdit && setIsEditing(true)}
      >
        <ExternalLinkIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">Click to add an embed</p>
      </div>
    );
  }

  return (
    <div className="group relative">
      {renderEmbed()}
      
      {canEdit && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmbedBlock;