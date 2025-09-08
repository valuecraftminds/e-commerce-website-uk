import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import DeleteModal from './modals/DeleteModal';
import Spinner from './Spinner';
import { FaEdit, FaTrash, FaCogs, FaEye, FaEyeSlash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import { useRef, useEffect } from 'react';

const StyleTable = ({ 
  styles, 
  loading, 
  tableActions, 
  handleRowClick,
  BASE_URL,
  onAfterDelete,
  refreshKey // optional: incremented by parent to trigger refresh
}) => {
  const [deleteModalId, setDeleteModalId] = useState(null);
    const [deleteModalStyle, setDeleteModalStyle] = useState(null);


  // Track page index to preserve it across data refreshes
  const pageIndexRef = useRef(0);

  // Error state for each style row (keyed by style_id) is now handled in parent (Style.js)

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
                src={`${BASE_URL}/uploads/styles/${img.trim()}`}                
                alt={`Style ${idx + 1}`}
                className="table-thumbnail"
                title={`Click to view larger image ${idx + 1}`}
              />
            ))}
          </div>
        )
      },
      {
        header: 'Style number',
        accessorKey: 'style_number',
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
        maxWidth: 200,
        cell: ({ row }) => {
          const style = row.original;
          const isView = style.is_view === 'yes';
          // Get error message from parent (Style.js)
          const errorMsg = typeof tableActions.getIsViewError === 'function' ? tableActions.getIsViewError(style.style_id) : '';
          return (
            <div className="table-actions">
              <FaEdit
                className="action-icon me-2 text-warning"
                onClick={(e) => {
                  e.stopPropagation();
                  tableActions.handleEditStyle(style);
                }}
                title="Edit Style"
                style={{ cursor: 'pointer' }}
                size={16}
              />
              <FaTrash
                className="action-icon me-2 text-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModalId(style.style_id);
                }}
                title="Delete Style"
                style={{ cursor: 'pointer' }}
                size={16}
              />
              <FaCogs
                className="action-icon me-2 text-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  tableActions.handleManageAttributes(style);
                }}
                title="Manage Attributes"
                style={{ cursor: 'pointer' }}
                size={16}
              />
              {isView ? (
                <FaEye
                  className="action-icon me-2 text-success"
                  title="Set Not Viewable"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (typeof tableActions.handleToggleIsView === 'function') {
                      await tableActions.handleToggleIsView(style, !isView);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                  size={16}
                />
              ) : (
                <FaEyeSlash
                  className="action-icon me-2 text-muted"
                  title="Set Viewable"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (typeof tableActions.handleToggleIsView === 'function') {
                      await tableActions.handleToggleIsView(style, !isView);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                  size={16}
                />
              )}
              {errorMsg && (
                <div style={{ color: 'red', fontSize: 12, marginTop: 2 }}>{errorMsg}</div>
              )}
            </div>
          );
        }
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
      pagination: { pageSize: 10, pageIndex: pageIndexRef.current }
    }
  });

  // When styles data changes, restore previous page index if possible
  useEffect(() => {
    // Save current page index before data changes
    const currentPage = table.getState().pagination.pageIndex;
    pageIndexRef.current = currentPage;
    // After data changes, restore page index if possible
    if (table.getPageCount() > pageIndexRef.current) {
      table.setPageIndex(pageIndexRef.current);
    } else {
      table.setPageIndex(0);
      pageIndexRef.current = 0;
    }
    // eslint-disable-next-line
  }, [styles]);

  const handleDeleteSuccess = (deletedId) => {
    tableActions.handleDeleteStyle(deletedId);
    setDeleteModalId(null);
    if (typeof onAfterDelete === 'function') {
      onAfterDelete();
    }
  };

  if (loading) {
    return <Spinner text="Loading styles..." />;
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

        {/* add how to measure guide */}
        <button
          className="btn btn-primary"
          onClick={() => tableActions.handleMeasureGuide()}
        >
          Add Measure Guide
        </button>
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
          className="btn btn-outline-secondary btn-sm me-2"
        >
          <FaChevronLeft className="me-1" /> Previous
        </button>
        <span className="pagination-info">
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="btn btn-outline-secondary btn-sm ms-2"
        >
          Next <FaChevronRight className="ms-1" />
        </button>
      </div>
      <DeleteModal
        id={deleteModalId}
        show={!!deleteModalId}
        onHide={() => setDeleteModalId(null)}
        deleteUrl={id => id ? `/api/admin/styles/delete-styles/${id}` : ''}
        entityLabel="style"
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default StyleTable;
