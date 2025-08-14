import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Filter,
  Download,
  Upload
} from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onExport?: () => void;
  onImport?: () => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({ 
  title,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onImport,
  searchPlaceholder = 'Pesquisar...',
  emptyMessage = 'Nenhum item encontrado',
  loading = false
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Filtrar dados baseado no termo de pesquisa
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    
    return columns.some(column => {
      if (!column.filterable) return false;
      
      const value = column.key === 'id' ? item.id : (item as any)[column.key];
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Ordenar dados
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = sortColumn === 'id' ? a.id : (a as any)[sortColumn];
    const bValue = sortColumn === 'id' ? b.id : (b as any)[sortColumn];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === sortedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sortedData.map(item => item.id)));
    }
  };

  const renderCellValue = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = column.key === 'id' ? item.id : (item as any)[column.key];
    return value?.toString() || '-';
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
            {title}
            {data.length > 0 && (
              <Badge variant="secondary" className="ml-2 glass-card">
                {data.length}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex flex-wrap gap-2">
            {onImport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onImport}
                className="glass-button"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            )}
            
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="glass-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
            
            {onAdd && (
              <Button
                onClick={onAdd}
                className="glass-button bg-gradient-to-r from-tech-600 to-tech-500 hover:from-tech-700 hover:to-tech-600 text-white shadow-neon"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            )}
          </div>
        </div>
        
        {/* Barra de pesquisa e filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-10"
            />
          </div>
          
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="glass-card">
                {selectedItems.size} selecionado(s)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems(new Set())}
                className="glass-button"
              >
                Limpar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tech-600"></div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Nenhum resultado encontrado para sua pesquisa.' : emptyMessage}
          </div>
        ) : (
          <div className="rounded-lg border border-tech-200/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="glass-card border-b border-tech-200/20">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === sortedData.length && sortedData.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-tech-300 text-tech-600 focus:ring-tech-500"
                    />
                  </TableHead>
                  
                  {columns.map((column) => (
                    <TableHead
                      key={column.key.toString()}
                      className={`${column.sortable ? 'cursor-pointer hover:bg-tech-50/50' : ''} font-medium`}
                      onClick={() => column.sortable && handleSort(column.key.toString())}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && sortColumn === column.key && (
                          <span className="text-tech-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  
                  {(onEdit || onDelete) && (
                    <TableHead className="w-12">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {sortedData.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-tech-50/30 transition-colors ${
                      selectedItems.has(item.id) ? 'bg-tech-100/20' : ''
                    }`}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-tech-300 text-tech-600 focus:ring-tech-500"
                      />
                    </TableCell>
                    
                    {columns.map((column) => (
                      <TableCell key={column.key.toString()}>
                        {renderCellValue(item, column)}
                      </TableCell>
                    ))}
                    
                    {(onEdit || onDelete) && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 p-0 glass-button">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card border-tech-200">
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(item)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}