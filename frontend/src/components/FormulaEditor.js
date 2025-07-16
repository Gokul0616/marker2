import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  FunctionSquareIcon, 
  CalendarIcon, 
  HashIcon, 
  TypeIcon,
  HelpCircleIcon,
  CheckIcon
} from 'lucide-react';

const FormulaEditor = ({ database, onSave, onClose }) => {
  const [formula, setFormula] = useState('');
  const [selectedFunction, setSelectedFunction] = useState(null);

  const formulaFunctions = [
    {
      category: 'Math',
      functions: [
        { name: 'add', syntax: 'add(number1, number2)', description: 'Adds two numbers' },
        { name: 'subtract', syntax: 'subtract(number1, number2)', description: 'Subtracts two numbers' },
        { name: 'multiply', syntax: 'multiply(number1, number2)', description: 'Multiplies two numbers' },
        { name: 'divide', syntax: 'divide(number1, number2)', description: 'Divides two numbers' },
        { name: 'round', syntax: 'round(number)', description: 'Rounds a number' },
        { name: 'abs', syntax: 'abs(number)', description: 'Absolute value' },
        { name: 'max', syntax: 'max(number1, number2)', description: 'Maximum of two numbers' },
        { name: 'min', syntax: 'min(number1, number2)', description: 'Minimum of two numbers' }
      ]
    },
    {
      category: 'Text',
      functions: [
        { name: 'concat', syntax: 'concat(text1, text2)', description: 'Concatenates two strings' },
        { name: 'length', syntax: 'length(text)', description: 'Length of text' },
        { name: 'upper', syntax: 'upper(text)', description: 'Converts to uppercase' },
        { name: 'lower', syntax: 'lower(text)', description: 'Converts to lowercase' },
        { name: 'substring', syntax: 'substring(text, start, end)', description: 'Extracts substring' },
        { name: 'contains', syntax: 'contains(text, search)', description: 'Checks if text contains search' }
      ]
    },
    {
      category: 'Date',
      functions: [
        { name: 'now', syntax: 'now()', description: 'Current date and time' },
        { name: 'today', syntax: 'today()', description: 'Current date' },
        { name: 'dateAdd', syntax: 'dateAdd(date, number, unit)', description: 'Adds time to date' },
        { name: 'dateBetween', syntax: 'dateBetween(date1, date2, unit)', description: 'Difference between dates' },
        { name: 'formatDate', syntax: 'formatDate(date, format)', description: 'Formats date' },
        { name: 'year', syntax: 'year(date)', description: 'Year from date' },
        { name: 'month', syntax: 'month(date)', description: 'Month from date' },
        { name: 'day', syntax: 'day(date)', description: 'Day from date' }
      ]
    },
    {
      category: 'Logic',
      functions: [
        { name: 'if', syntax: 'if(condition, value1, value2)', description: 'Conditional logic' },
        { name: 'and', syntax: 'and(condition1, condition2)', description: 'Logical AND' },
        { name: 'or', syntax: 'or(condition1, condition2)', description: 'Logical OR' },
        { name: 'not', syntax: 'not(condition)', description: 'Logical NOT' },
        { name: 'empty', syntax: 'empty(value)', description: 'Checks if value is empty' },
        { name: 'equal', syntax: 'equal(value1, value2)', description: 'Checks if values are equal' }
      ]
    },
    {
      category: 'Properties',
      functions: [
        { name: 'prop', syntax: 'prop("Property Name")', description: 'Gets property value' },
        { name: 'sum', syntax: 'sum(property)', description: 'Sums property values' },
        { name: 'count', syntax: 'count(property)', description: 'Counts non-empty values' },
        { name: 'average', syntax: 'average(property)', description: 'Average of property values' }
      ]
    }
  ];

  const insertFunction = (functionObj) => {
    const cursorPosition = formula.length;
    const newFormula = formula + functionObj.syntax;
    setFormula(newFormula);
  };

  const insertProperty = (propertyName) => {
    const cursorPosition = formula.length;
    const newFormula = formula + `prop("${propertyName}")`;
    setFormula(newFormula);
  };

  const exampleFormulas = [
    {
      name: 'Days until due',
      formula: 'dateBetween(prop("Due Date"), now(), "days")',
      description: 'Calculate days until due date'
    },
    {
      name: 'Status badge',
      formula: 'if(prop("Status") = "Done", "✅", "⏳")',
      description: 'Show different icons based on status'
    },
    {
      name: 'Progress percentage',
      formula: 'round(prop("Completed") / prop("Total") * 100)',
      description: 'Calculate completion percentage'
    },
    {
      name: 'Full name',
      formula: 'concat(prop("First Name"), " ", prop("Last Name"))',
      description: 'Combine first and last name'
    }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Formula Editor</DialogTitle>
        </DialogHeader>

        <div className="flex h-[60vh]">
          {/* Left Panel - Formula Input */}
          <div className="flex-1 flex flex-col space-y-4 pr-4">
            <div>
              <Label htmlFor="formula">Formula</Label>
              <Textarea
                id="formula"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Enter your formula here..."
                className="min-h-[120px] font-mono text-sm"
              />
            </div>

            <div>
              <Label>Properties</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.values(database.properties).map((property) => (
                  <Badge
                    key={property.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => insertProperty(property.name)}
                  >
                    {property.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Example Formulas</Label>
              <div className="space-y-2 mt-2">
                {exampleFormulas.map((example, index) => (
                  <div key={index} className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{example.name}</div>
                        <div className="text-xs text-gray-600">{example.description}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormula(example.formula)}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={() => onSave(formula)} disabled={!formula.trim()}>
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Formula
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>

          {/* Right Panel - Functions */}
          <div className="w-80 border-l border-gray-200 pl-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FunctionSquareIcon className="h-4 w-4" />
                  <Label>Functions</Label>
                </div>

                {formulaFunctions.map((category) => (
                  <div key={category.category}>
                    <h4 className="font-medium text-sm mb-2">{category.category}</h4>
                    <div className="space-y-1">
                      {category.functions.map((func) => (
                        <div
                          key={func.name}
                          className="p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => insertFunction(func)}
                        >
                          <div className="font-mono text-sm font-medium">{func.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{func.description}</div>
                          <div className="text-xs text-gray-400 mt-1 font-mono">{func.syntax}</div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-3" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaEditor;