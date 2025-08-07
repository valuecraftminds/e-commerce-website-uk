import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useMemo } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

const StyleTable = ({ 
  styles, 
  loading, 
  tableActions, 
  handleRowClick,
  BASE_URL 
}) => {
  const columns = useMemo(
    () => [
      {
        header: 'Images',
        accessorKey: 'image',
        maxWidth: 100,
        cell: ({ getValue }) => (
          <div className="table-images">
            {getValue() && getValue().split(',').map((img, idx) => (
              <img
                key={idx}
                src={`${BASE_URL}/uploads/styles/${img.trim()}`}                alt={`Style ${idx + 1}`}
                className="table-thumbnail"
                title={`Click to view larger image ${idx + 1}`}
              />
            ))}
          </div>
        )
      },
      {
        header: 'Code',
        accessorKey: 'style_code',
        maxWidth: 80,
      },
      {
        header: 'Name',
        accessorKey: 'name',
        maxWidth: 150,
      },
      {
        header: 'Description',
        accessorKey: 'description',
        maxWidth: 200,
        cell: ({ getValue }) => (
          <div title={getValue()} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getValue()}
          </div>
        )
      },
      {
        header: 'Main Cat.',
        accessorKey: 'main_category_name',
        maxWidth: 100,
      },
      {
        header: 'Sub Cat.',
        accessorKey: 'subcategory_name',
        maxWidth: 100,
      },
      {
        header: 'Status',
        accessorKey: 'approved',
        maxWidth: 80,
        cell: ({ getValue }) => (
          <span className={`status-badge ${getValue() === 'yes' ? 'approved' : 'pending'}`}>
            {getValue() === 'yes' ? 'Approved' : 'Pending'}
          </span>
        )
      },
      {
        header: 'Actions',
        maxWidth: 100,
        cell: ({ row }) => (
          <div className="table-actions">
            <button
              className="action-btn edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                tableActions.handleEditStyle(row.original);
              }}
              title="Edit"
            >
              <FaEdit size={14} />
            </button>
            <button
              className="action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                tableActions.handleDeleteStyle(row.original.style_id);
              }}
              title="Delete"
            >
              <FaTrash size={14} />
            </button>
          </div>
        )
      }
    ],
    [tableActions, BASE_URL]
  );

  const table = useReactTable({
    data: styles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  if (loading) {
    return <div className="loading">Loading styles...</div>;
  }

  if (styles.length === 0) {
    return null;
  }

  return (
    <>
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search styles..."
          className="search-input"
          onChange={e => table.setGlobalFilter(e.target.value)}
        />
      </div>

      <table className="styles-table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  <span className="sort-indicator">
                    {header.column.getIsSorted()
                      ? header.column.getIsSorted() === "desc"
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              onClick={() => handleRowClick(row.original)}
              className="clickable-row"
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default StyleTable;
