import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNotion } from '../contexts/NotionContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const TemplateGallery = () => {
  const { templates } = useNotion();
  const { createPage } = useWorkspace();
  const navigate = useNavigate();

  const handleUseTemplate = (template) => {
    const newPage = createPage();
    
    if (newPage) {
      // Apply template content
      const templateContent = template.content.map((block, index) => ({
        id: `block_${Date.now()}_${index}`,
        type: block.type,
        content: block.content,
        properties: block.properties || {}
      }));

      // Update page with template content
      // This would normally be handled by the workspace context
      console.log('Creating page from template:', template.name);
      navigate(`/page/${newPage.id}`);
    }
  };

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Templates</h2>
        <Button variant="outline" size="sm">
          Browse all templates
        </Button>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-medium capitalize">
            {category.replace('-', ' ')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates
              .filter(template => template.category === category)
              .map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {template.category.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm mb-4">
                      {template.description}
                    </CardDescription>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500">Includes:</div>
                      <div className="flex flex-wrap gap-1">
                        {template.content.slice(0, 3).map((block, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {block.type.replace('_', ' ')}
                          </Badge>
                        ))}
                        {template.content.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.content.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use this template
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Create Your Own Template</h3>
          <p className="text-gray-600">
            Build a custom template that fits your workflow perfectly
          </p>
          <Button variant="outline">
            Create Template
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;