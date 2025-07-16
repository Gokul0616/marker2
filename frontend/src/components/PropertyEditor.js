import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  TypeIcon, 
  TagIcon, 
  HashIcon, 
  CalendarIcon, 
  UserIcon, 
  CheckSquareIcon,
  PlusIcon,
  TrashIcon,
  GripVerticalIcon
} from 'lucide-react';

const PropertyEditor = ({ database, onUpdateProperty, onAddProperty, onClose }) => {
  const [mode, setMode] = useState('list'); // 'list' or 'edit' or 'create'
  const [editingProperty, setEditingProperty] = useState(null);
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: 'text',
    options: []
  });

  const propertyTypes = [
    { value: 'title', label: 'Title', icon: TypeIcon },
    { value: 'text', label: 'Text', icon: TypeIcon },
    { value: 'number', label: 'Number', icon: HashIcon },
    { value: 'select', label: 'Select', icon: TagIcon },
    { value: 'date', label: 'Date', icon: CalendarIcon },
    { value: 'person', label: 'Person', icon: UserIcon },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquareIcon },
    { value: 'formula', label: 'Formula', icon: HashIcon }
  ];

  const handleCreateProperty = () => {
    if (newProperty.name.trim()) {
      const property = {
        id: `prop_${Date.now()}`,
        name: newProperty.name,
        type: newProperty.type,
        ...(newProperty.type === 'select' && { options: newProperty.options })
      };
      onAddProperty(property);
      setNewProperty({ name: '', type: 'text', options: [] });
      setMode('list');
    }
  };

  const handleUpdateProperty = (propertyId, updates) => {
    onUpdateProperty(propertyId, updates);
    setEditingProperty(null);
    setMode('list');
  };

  const addSelectOption = (propertyData, setPropertyData) => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'gray'];
    const newOption = {
      id: `option_${Date.now()}`,
      name: 'New Option',
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setPropertyData({
      ...propertyData,
      options: [...(propertyData.options || []), newOption]
    });
  };

  const removeSelectOption = (propertyData, setPropertyData, optionId) => {
    setPropertyData({
      ...propertyData,
      options: (propertyData.options || []).filter(opt => opt.id !== optionId)
    });
  };

  const renderPropertyList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Properties</h3>
        <Button onClick={() => setMode('create')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="space-y-2">
        {Object.values(database.properties).map((property) => {
          const typeInfo = propertyTypes.find(t => t.value === property.type);
          const Icon = typeInfo?.icon || TypeIcon;
          
          return (
            <div key={property.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <GripVerticalIcon className="h-4 w-4 text-gray-400" />
                <Icon className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{property.name}</div>
                  <div className="text-sm text-gray-500">{typeInfo?.label}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {property.type === 'select' && (
                  <Badge variant="secondary" className="text-xs">
                    {property.options?.length || 0} options
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingProperty(property);
                    setMode('edit');
                  }}
                >
                  Edit
                </Button>
                {property.type !== 'title' && (
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPropertyForm = (property, setProperty, onSave, title) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="property-name">Property Name</Label>
          <Input
            id="property-name"
            value={property.name}
            onChange={(e) => setProperty({ ...property, name: e.target.value })}
            placeholder="Enter property name"
          />
        </div>

        <div>
          <Label htmlFor="property-type">Property Type</Label>
          <Select value={property.type} onValueChange={(value) => setProperty({ ...property, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {property.type === 'select' && (
          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {(property.options || []).map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${option.color}-500`} />
                  <Input
                    value={option.name}
                    onChange={(e) => setProperty({
                      ...property,
                      options: property.options.map(opt => 
                        opt.id === option.id ? { ...opt, name: e.target.value } : opt
                      )
                    })}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectOption(property, setProperty, option.id)}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSelectOption(property, setProperty)}
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {property.type === 'number' && (
          <div>
            <Label>Format</Label>
            <Select
              value={property.format || 'number'}
              onValueChange={(value) => setProperty({ ...property, format: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="percent">Percent</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {property.type === 'formula' && (
          <div>
            <Label>Formula</Label>
            <Input
              value={property.formula || ''}
              onChange={(e) => setProperty({ ...property, formula: e.target.value })}
              placeholder="Enter formula (e.g., prop('Due Date') - now())"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button onClick={onSave} disabled={!property.name.trim()}>
          {title.includes('Create') ? 'Create' : 'Save'}
        </Button>
        <Button variant="outline" onClick={() => setMode('list')}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'list' && 'Database Properties'}
            {mode === 'create' && 'Create Property'}
            {mode === 'edit' && 'Edit Property'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'list' && renderPropertyList()}
        {mode === 'create' && renderPropertyForm(
          newProperty,
          setNewProperty,
          handleCreateProperty,
          'Create Property'
        )}
        {mode === 'edit' && editingProperty && renderPropertyForm(
          editingProperty,
          setEditingProperty,
          () => handleUpdateProperty(editingProperty.id, editingProperty),
          'Edit Property'
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PropertyEditor;