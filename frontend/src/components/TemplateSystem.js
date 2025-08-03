import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { 
  FileTextIcon, 
  BookOpenIcon, 
  CalendarIcon,
  BriefcaseIcon,
  UserIcon,
  StarIcon,
  SearchIcon,
  TagIcon,
  LayoutGridIcon
} from 'lucide-react';

const TemplateSystem = ({ onSelectTemplate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { createPage } = useWorkspace();

  const templates = [
    {
      id: 'meeting-notes',
      title: 'Meeting Notes',
      description: 'Structure for capturing meeting discussions and action items',
      category: 'productivity',
      icon: '📝',
      preview: 'Preview of meeting notes template...',
      content: [
        { type: 'heading1', content: 'Meeting Notes - [Date]' },
        { type: 'paragraph', content: '**Attendees:** ' },
        { type: 'paragraph', content: '**Date:** ' },
        { type: 'paragraph', content: '**Duration:** ' },
        { type: 'heading2', content: 'Agenda' },
        { type: 'bulleted_list', content: 'Agenda item 1' },
        { type: 'bulleted_list', content: 'Agenda item 2' },
        { type: 'heading2', content: 'Discussion Notes' },
        { type: 'paragraph', content: 'Key discussion points...' },
        { type: 'heading2', content: 'Action Items' },
        { type: 'checkbox', content: 'Action item 1', properties: { checked: false } },
        { type: 'checkbox', content: 'Action item 2', properties: { checked: false } },
        { type: 'heading2', content: 'Next Steps' },
        { type: 'paragraph', content: 'Next meeting date:' }
      ]
    },
    {
      id: 'project-plan',
      title: 'Project Plan',
      description: 'Comprehensive project planning template with timeline and tasks',
      category: 'project-management',
      icon: '📊',
      preview: 'Project planning structure...',
      content: [
        { type: 'heading1', content: 'Project Plan: [Project Name]' },
        { type: 'paragraph', content: '**Project Manager:** ' },
        { type: 'paragraph', content: '**Start Date:** ' },
        { type: 'paragraph', content: '**End Date:** ' },
        { type: 'paragraph', content: '**Status:** 🟡 In Progress' },
        { type: 'heading2', content: 'Project Overview' },
        { type: 'paragraph', content: 'Brief description of the project goals and objectives...' },
        { type: 'heading2', content: 'Key Stakeholders' },
        { type: 'table', content: '', properties: { 
          table: {
            rows: [
              { id: 'header', cells: ['Name', 'Role', 'Contact'], isHeader: true },
              { id: 'row1', cells: ['', '', ''], isHeader: false }
            ],
            columns: 3
          }
        }},
        { type: 'heading2', content: 'Project Timeline' },
        { type: 'checkbox', content: 'Phase 1: Planning', properties: { checked: false } },
        { type: 'checkbox', content: 'Phase 2: Development', properties: { checked: false } },
        { type: 'checkbox', content: 'Phase 3: Testing', properties: { checked: false } },
        { type: 'checkbox', content: 'Phase 4: Launch', properties: { checked: false } },
        { type: 'heading2', content: 'Resources & Budget' },
        { type: 'paragraph', content: 'Budget: $' },
        { type: 'paragraph', content: 'Team members needed:' }
      ]
    },
    {
      id: 'personal-journal',
      title: 'Personal Journal',
      description: 'Daily reflection and journaling template',
      category: 'personal',
      icon: '📔',
      preview: 'Personal journaling format...',
      content: [
        { type: 'heading1', content: 'Journal Entry - [Date]' },
        { type: 'paragraph', content: '**Mood:** ' },
        { type: 'paragraph', content: '**Weather:** ' },
        { type: 'heading2', content: 'Today I am grateful for...' },
        { type: 'bulleted_list', content: 'Gratitude item 1' },
        { type: 'bulleted_list', content: 'Gratitude item 2' },
        { type: 'bulleted_list', content: 'Gratitude item 3' },
        { type: 'heading2', content: 'What happened today?' },
        { type: 'paragraph', content: 'Write about your day...' },
        { type: 'heading2', content: 'Lessons learned' },
        { type: 'paragraph', content: 'What did I learn today?' },
        { type: 'heading2', content: 'Tomorrow I will...' },
        { type: 'checkbox', content: 'Goal for tomorrow', properties: { checked: false } }
      ]
    },
    {
      id: 'book-review',
      title: 'Book Review',
      description: 'Template for reviewing and summarizing books',
      category: 'education',
      icon: '📚',
      preview: 'Book review structure...',
      content: [
        { type: 'heading1', content: 'Book Review: [Book Title]' },
        { type: 'paragraph', content: '**Author:** ' },
        { type: 'paragraph', content: '**Genre:** ' },
        { type: 'paragraph', content: '**Pages:** ' },
        { type: 'paragraph', content: '**Rating:** ⭐⭐⭐⭐⭐' },
        { type: 'heading2', content: 'Summary' },
        { type: 'paragraph', content: 'Brief summary of the book...' },
        { type: 'heading2', content: 'Key Takeaways' },
        { type: 'bulleted_list', content: 'Key insight 1' },
        { type: 'bulleted_list', content: 'Key insight 2' },
        { type: 'bulleted_list', content: 'Key insight 3' },
        { type: 'heading2', content: 'Favorite Quotes' },
        { type: 'quote', content: 'Insert favorite quote here...' },
        { type: 'heading2', content: 'My Thoughts' },
        { type: 'paragraph', content: 'Personal reflection on the book...' },
        { type: 'heading2', content: 'Would I recommend?' },
        { type: 'paragraph', content: 'Yes/No and why...' }
      ]
    },
    {
      id: 'recipe',
      title: 'Recipe',
      description: 'Cooking recipe with ingredients and instructions',
      category: 'lifestyle',
      icon: '👨‍🍳',
      preview: 'Recipe format...',
      content: [
        { type: 'heading1', content: '[Recipe Name]' },
        { type: 'paragraph', content: '**Prep Time:** ' },
        { type: 'paragraph', content: '**Cook Time:** ' },
        { type: 'paragraph', content: '**Servings:** ' },
        { type: 'paragraph', content: '**Difficulty:** ' },
        { type: 'heading2', content: 'Ingredients' },
        { type: 'checkbox', content: 'Ingredient 1', properties: { checked: false } },
        { type: 'checkbox', content: 'Ingredient 2', properties: { checked: false } },
        { type: 'checkbox', content: 'Ingredient 3', properties: { checked: false } },
        { type: 'heading2', content: 'Instructions' },
        { type: 'numbered_list', content: 'Step 1' },
        { type: 'numbered_list', content: 'Step 2' },
        { type: 'numbered_list', content: 'Step 3' },
        { type: 'heading2', content: 'Notes' },
        { type: 'paragraph', content: 'Additional tips or variations...' },
        { type: 'heading2', content: 'Photo' },
        { type: 'image', content: '' }
      ]
    },
    {
      id: 'travel-itinerary',
      title: 'Travel Itinerary',
      description: 'Plan your trips with detailed itinerary',
      category: 'lifestyle',
      icon: '✈️',
      preview: 'Travel planning template...',
      content: [
        { type: 'heading1', content: 'Travel Itinerary: [Destination]' },
        { type: 'paragraph', content: '**Dates:** ' },
        { type: 'paragraph', content: '**Travelers:** ' },
        { type: 'paragraph', content: '**Budget:** ' },
        { type: 'heading2', content: 'Flight Information' },
        { type: 'table', content: '', properties: { 
          table: {
            rows: [
              { id: 'header', cells: ['Flight', 'Date', 'Time', 'Confirmation'], isHeader: true },
              { id: 'row1', cells: ['Outbound', '', '', ''], isHeader: false },
              { id: 'row2', cells: ['Return', '', '', ''], isHeader: false }
            ],
            columns: 4
          }
        }},
        { type: 'heading2', content: 'Accommodation' },
        { type: 'paragraph', content: '**Hotel:** ' },
        { type: 'paragraph', content: '**Address:** ' },
        { type: 'paragraph', content: '**Check-in:** ' },
        { type: 'paragraph', content: '**Check-out:** ' },
        { type: 'heading2', content: 'Daily Itinerary' },
        { type: 'heading3', content: 'Day 1' },
        { type: 'checkbox', content: 'Activity 1', properties: { checked: false } },
        { type: 'checkbox', content: 'Activity 2', properties: { checked: false } },
        { type: 'heading2', content: 'Packing Checklist' },
        { type: 'checkbox', content: 'Passport', properties: { checked: false } },
        { type: 'checkbox', content: 'Tickets', properties: { checked: false } },
        { type: 'checkbox', content: 'Clothes', properties: { checked: false } }
      ]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: LayoutGridIcon },
    { id: 'productivity', name: 'Productivity', icon: BriefcaseIcon },
    { id: 'project-management', name: 'Project Management', icon: CalendarIcon },
    { id: 'personal', name: 'Personal', icon: UserIcon },
    { id: 'education', name: 'Education', icon: BookOpenIcon },
    { id: 'lifestyle', name: 'Lifestyle', icon: StarIcon }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template) => {
    const newPage = createPage(template.title, template.content);
    if (onSelectTemplate) {
      onSelectTemplate(template, newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Gallery</h2>
        <p className="text-gray-600">Start with a pre-designed template to save time</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <IconComponent className="h-4 w-4" />
                <span>{category.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {categories.find(c => c.id === template.category)?.name}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {template.description}
              </p>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1"
                >
                  Use Template
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <span className="text-xl">{template.icon}</span>
                        <span>{template.title}</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-600">{template.description}</p>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium mb-2">Template Structure:</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {template.content.map((block, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className="w-20 text-xs font-mono text-gray-400">
                                {block.type}
                              </span>
                              <span className="truncate">
                                {block.content || 'Interactive element'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleUseTemplate(template)}
                        className="w-full"
                      >
                        Use This Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search terms or category filter</p>
        </div>
      )}
    </div>
  );
};

export default TemplateSystem;