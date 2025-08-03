import React from 'react';
import { useNavigate } from 'react-router-dom';
import TemplateSystem from './TemplateSystem';
import { toast } from 'sonner';

const TemplateGallery = () => {
  const navigate = useNavigate();

  const handleSelectTemplate = (template, newPage) => {
    if (newPage) {
      toast.success(`Created page from template: ${template.title}`);
      navigate(`/page/${newPage.id}`);
    } else {
      toast.error('Failed to create page from template');
    }
  };

  return (
    <div className="py-6">
      <TemplateSystem onSelectTemplate={handleSelectTemplate} />
    </div>
  );
};

export default TemplateGallery;