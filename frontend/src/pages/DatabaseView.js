import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotion } from '../contexts/NotionContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import DatabaseHeader from '../components/DatabaseHeader';
import DatabaseTable from '../components/DatabaseTable';
import DatabaseKanban from '../components/DatabaseKanban';
import PropertyEditor from '../components/PropertyEditor';
import FormulaEditor from '../components/FormulaEditor';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  TableIcon, 
  KanbanSquareIcon, 
  CalendarIcon, 
  BarChart3Icon,
  PlusIcon,
  FilterIcon,
  SortAscIcon,
  EyeIcon,
  SettingsIcon
} from 'lucide-react';

const DatabaseView = () => {
  const { databaseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { databases, updateDatabase, addDatabaseRow, updateDatabaseRow, executeFormula } = useNotion();
  const [selectedView, setSelectedView] = useState('table');
  const [showPropertyEditor, setShowPropertyEditor] = useState(false);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [filters, setFilters] = useState({});
  const [sorts, setSorts] = useState([]);

  const database = databases.find(db => db.id === databaseId);

  useEffect(() => {
    if (!database) {
      navigate('/');
    }
  }, [database, navigate]);

  if (!database) {
    return <div>Database not found</div>;
  }

  const currentView = database.views.find(v => v.type === selectedView) || database.views[0];

  const handleAddRow = () => {
    const newRowData = {};
    Object.keys(database.properties).forEach(key => {
      const prop = database.properties[key];
      if (prop.type === 'title') {
        newRowData[key] = 'Untitled';
      } else if (prop.type === 'number') {
        newRowData[key] = 0;
      } else if (prop.type === 'select') {
        newRowData[key] = prop.options?.[0]?.id || '';
      } else if (prop.type === 'date') {
        newRowData[key] = new Date().toISOString().split('T')[0];
      } else {
        newRowData[key] = '';
      }
    });
    addDatabaseRow(databaseId, newRowData);
  };

  const handleUpdateRow = (rowId, updates) => {
    updateDatabaseRow(databaseId, rowId, updates);
  };

  const handleUpdateProperty = (propertyId, updates) => {
    const newProperties = { ...database.properties };
    newProperties[propertyId] = { ...newProperties[propertyId], ...updates };
    updateDatabase(databaseId, { properties: newProperties });
  };

  const handleAddProperty = (property) => {
    const newProperties = { ...database.properties };
    newProperties[property.id] = property;
    updateDatabase(databaseId, { properties: newProperties });
  };

  const processedRows = database.rows.map(row => {
    const processedRow = { ...row };
    
    // Calculate formula values
    Object.keys(database.properties).forEach(key => {
      const prop = database.properties[key];
      if (prop.type === 'formula') {
        processedRow.properties[key] = executeFormula(prop.formula, row.properties);
      }
    });
    
    return processedRow;
  });

  const viewIcons = {
    table: TableIcon,
    kanban: KanbanSquareIcon,
    calendar: CalendarIcon,
    chart: BarChart3Icon
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <DatabaseHeader 
          database={database}
          onUpdateDatabase={updateDatabase}
          onShowPropertyEditor={() => setShowPropertyEditor(true)}
        />

        {/* View Controls */}
        <div className="border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Tabs value={selectedView} onValueChange={setSelectedView}>
                <TabsList className="grid w-full grid-cols-4">
                  {database.views.map((view) => {
                    const Icon = viewIcons[view.type];
                    return (
                      <TabsTrigger key={view.id} value={view.type} className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{view.name}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <FilterIcon className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <SortAscIcon className="h-4 w-4 mr-1" />
                Sort
              </Button>
              <Button variant="outline" size="sm">
                <EyeIcon className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPropertyEditor(true)}>
                <SettingsIcon className="h-4 w-4 mr-1" />
                Properties
              </Button>
              <Button onClick={handleAddRow}>
                <PlusIcon className="h-4 w-4 mr-1" />
                New
              </Button>
            </div>
          </div>
        </div>

        {/* Database Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={selectedView} onValueChange={setSelectedView}>
            <TabsContent value="table" className="h-full">
              <DatabaseTable
                database={database}
                rows={processedRows}
                onUpdateRow={handleUpdateRow}
                onAddRow={handleAddRow}
                onUpdateProperty={handleUpdateProperty}
              />
            </TabsContent>
            
            <TabsContent value="kanban" className="h-full">
              <DatabaseKanban
                database={database}
                rows={processedRows}
                onUpdateRow={handleUpdateRow}
                onAddRow={handleAddRow}
                groupBy={currentView.groupBy || 'status'}
              />
            </TabsContent>
            
            <TabsContent value="calendar" className="h-full">
              <div className="p-6">
                <div className="text-center py-12">
                  <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
                  <p className="text-gray-600">Calendar view coming soon...</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="chart" className="h-full">
              <div className="p-6">
                <div className="text-center py-12">
                  <BarChart3Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chart View</h3>
                  <p className="text-gray-600">Chart visualization coming soon...</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Property Editor Modal */}
      {showPropertyEditor && (
        <PropertyEditor
          database={database}
          onUpdateProperty={handleUpdateProperty}
          onAddProperty={handleAddProperty}
          onClose={() => setShowPropertyEditor(false)}
        />
      )}

      {/* Formula Editor Modal */}
      {showFormulaEditor && (
        <FormulaEditor
          database={database}
          onSave={(formula) => {
            console.log('Save formula:', formula);
            setShowFormulaEditor(false);
          }}
          onClose={() => setShowFormulaEditor(false)}
        />
      )}
    </div>
  );
};

export default DatabaseView;