// components/test-selection-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { TestCategoryTree, TestTemplateSearchResult, TestTemplateWithCategory, TestTemplateWithCategoryAndParams } from '../types';

interface TestSelectionFormProps {
  selectedTests: TestTemplateWithCategoryAndParams[]; // Update this
  onTestsChange: (selectedTests: TestTemplateWithCategoryAndParams[]) => void; // And this
}

export function TestSelectionForm({ selectedTests = [], onTestsChange }: TestSelectionFormProps) {
  const [categories, setCategories] = useState<TestCategoryTree[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TestTemplateSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Use the selectedTests from props directly
  const safeSelectedTests = selectedTests || [];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/test-categories');
      if (response.ok) {
        const result = await response.json();
        const categoriesData = result.data || result;
        setCategories(categoriesData);

        // Expand all categories by default
        const allCategoryIds = new Set<string>();
        const collectCategoryIds = (cats: TestCategoryTree[]) => {
          cats.forEach(cat => {
            allCategoryIds.add(cat.id);
            if (cat.children && cat.children.length > 0) {
              collectCategoryIds(cat.children);
            }
          });
        };
        collectCategoryIds(categoriesData);
        setExpandedCategories(allCategoryIds);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/test-templates?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data || result);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Update the addTest function to ensure parameters are included
  // In TestSelectionForm - addTest function
  const addTest = (test: any) => {
    // Convert any test type to TestTemplateWithCategoryAndParams
    const testWithParams: TestTemplateWithCategoryAndParams = {
      ...test,
      parameters: test.parameters || [],
      category: test.category || {
        id: test.category_id || 'unknown-category',
        name: 'Unknown Category',
        created_at: new Date(),
        updated_at: new Date(),
        description: null,
        parent_id: null,
        is_active: true
      }
    };

    // Double-check for duplicates
    if (safeSelectedTests.find(t => t.id === testWithParams.id)) {
      return;
    }

    const newSelection = [...safeSelectedTests, testWithParams];
    onTestsChange(newSelection);
    setSearchQuery('');
    setSearchResults([]);
  };

  {
    searchResults.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {searchResults.map((test: TestTemplateWithCategory | TestTemplateWithCategoryAndParams) => (
          <div
            key={test.id}
            className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
            onClick={() => addTest(test)}
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{test.name}</div>
              <div className="text-sm text-gray-600">
                {test.code} • {test.category?.name || 'Unknown Category'} • {test.specimen}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">
                ${test.fees?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-gray-500">Add →</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const removeTest = (testId: string) => {
    onTestsChange(safeSelectedTests.filter(t => t.id !== testId));
  };

  // Safe total fees calculation
  const totalFees = safeSelectedTests.reduce((total, test) => total + (test.fees || 0), 0);

  const renderCategoryTree = (categories: TestCategoryTree[], level = 0) => {
    return categories.map(category => (
      <div key={category.id} className="ml-4">
        <div
          className="flex items-center py-2 hover:bg-gray-50 cursor-pointer"
          onClick={() => toggleCategory(category.id)}
        >
          <div className="w-4 mr-2">
            {(category.children && category.children.length > 0) || (category.tests && category.tests.length > 0) ? (
              <span className="text-gray-500">
                {expandedCategories.has(category.id) ? '▼' : '▶'}
              </span>
            ) : null}
          </div>
          <span className="font-medium text-gray-900">{category.name}</span>
          {category.description && (
            <span className="text-sm text-gray-500 ml-2">- {category.description}</span>
          )}
        </div>

        {expandedCategories.has(category.id) && (
          <>
            {/* Render tests in this category */}
            {category.tests && category.tests.map(test => (
              <div
                key={test.id}
                className="flex items-center justify-between py-2 px-4 hover:bg-blue-50 cursor-pointer border-l-2 border-blue-200 ml-4"
                onClick={() => addTest(test)}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{test.name}</div>
                  <div className="text-sm text-gray-600">
                    {test.code} • {test.specimen} • {test.turnaround_time}
                  </div>
                  {test.description && (
                    <div className="text-sm text-gray-500 mt-1">{test.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    ${test.fees?.toFixed(2) || '0.00'}
                  </div>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      addTest(test);
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}

            {/* Render child categories */}
            {category.children && category.children.length > 0 && renderCategoryTree(category.children, level + 1)}
          </>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading test catalog...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for tests... (e.g., CBC, Glucose, Lipid)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(test => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                onClick={() => addTest(test)}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{test.name}</div>
                  <div className="text-sm text-gray-600">
                    {test.code} • {test.category?.name || 'Unknown Category'} • {test.specimen}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    ${test.fees?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-500">Add →</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Categories Tree */}
        <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Test Categories</h3>
          {categories.length > 0 ? (
            renderCategoryTree(categories)
          ) : (
            <div className="text-center text-gray-500 py-4">
              No test categories available
            </div>
          )}
        </div>

        {/* Selected Tests */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Selected Tests ({safeSelectedTests.length})
          </h3>

          {safeSelectedTests.length === 0 ? (
            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded">
              No tests selected. Please select at least one test.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {safeSelectedTests.map(test => (
                <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{test.name}</div>
                    <div className="text-sm text-gray-600">
                      {test.code} • {test.category?.name || 'Unknown Category'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ${test.fees?.toFixed(2) || '0.00'}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTest(test.id)}
                      className="text-red-600 hover:text-red-800 text-sm mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total Fees */}
          {safeSelectedTests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Fees:</span>
                <span className="text-xl font-bold text-green-600">
                  ${totalFees.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {safeSelectedTests.length === 0 && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
          ⚠️ Please select at least one test to proceed.
        </div>
      )}
    </div>
  );
}