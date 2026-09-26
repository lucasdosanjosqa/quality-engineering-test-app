import type {
  ProductCategory,
  ProductListQuery,
  ProductListResponse,
  ProductSortField,
  ProductStatus,
} from '@commerceops/contracts';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import styles from '../App.module.css';
import { getProducts } from '../api/client';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

type CatalogResult =
  | { queryKey: string; status: 'success'; data: ProductListResponse }
  | { queryKey: string; status: 'error' };

const categories: { label: string; value: ProductCategory }[] = [
  { label: 'Accessories', value: 'accessories' },
  { label: 'Audio', value: 'audio' },
  { label: 'Keyboards', value: 'keyboards' },
  { label: 'Monitors', value: 'monitors' },
  { label: 'Workspace', value: 'workspace' },
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function optionalCategory(value: string): ProductCategory | undefined {
  return value === '' ? undefined : (value as ProductCategory);
}

function optionalStatus(value: string): ProductStatus | undefined {
  return value === '' ? undefined : (value as ProductStatus);
}

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory>();
  const [status, setStatus] = useState<ProductStatus>();
  const [sortBy, setSortBy] = useState<ProductSortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<CatalogResult>();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const query = useMemo<ProductListQuery>(
    () => ({
      ...(debouncedSearch === '' ? {} : { search: debouncedSearch }),
      ...(category === undefined ? {} : { category }),
      ...(status === undefined ? {} : { status }),
      sortBy,
      sortOrder,
      page,
      pageSize: 5,
    }),
    [debouncedSearch, category, status, sortBy, sortOrder, page],
  );
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    const controller = new AbortController();
    void getProducts(query, controller.signal)
      .then((data) => setResult({ queryKey, status: 'success', data }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setResult({ queryKey, status: 'error' });
        }
      });
    return () => controller.abort();
  }, [query, queryKey]);

  const currentResult = result?.queryKey === queryKey ? result : undefined;
  const loading = currentResult === undefined;
  const data =
    currentResult?.status === 'success' ? currentResult.data : undefined;

  function resetPage(): void {
    setPage(1);
  }

  return (
    <main className={styles.pageLayout}>
      <nav aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link> / <span>Products</span>
      </nav>
      <header className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Catalog</p>
          <h1>Products</h1>
        </div>
      </header>

      <section className={styles.filters} aria-label="Product filters">
        <div>
          <label htmlFor="product-search">Search</label>
          <input
            id="product-search"
            type="search"
            value={search}
            placeholder="Name or SKU"
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
          />
        </div>
        <div>
          <label htmlFor="product-category">Category</label>
          <select
            id="product-category"
            value={category ?? ''}
            onChange={(event) => {
              setCategory(optionalCategory(event.target.value));
              resetPage();
            }}
          >
            <option value="">All categories</option>
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-status">Status</label>
          <select
            id="product-status"
            value={status ?? ''}
            onChange={(event) => {
              setStatus(optionalStatus(event.target.value));
              resetPage();
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label htmlFor="product-sort">Sort by</label>
          <select
            id="product-sort"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as ProductSortField);
              resetPage();
            }}
          >
            <option value="name">Name</option>
            <option value="sku">SKU</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
            <option value="updatedAt">Last updated</option>
          </select>
        </div>
        <div>
          <label htmlFor="product-direction">Direction</label>
          <select
            id="product-direction"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as 'asc' | 'desc');
              resetPage();
            }}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </section>

      {loading && <p role="status">Loading products…</p>}
      {currentResult?.status === 'error' && (
        <p role="alert">Products could not be loaded.</p>
      )}
      {data !== undefined && data.items.length === 0 && (
        <section className={styles.emptyState} aria-labelledby="empty-heading">
          <h2 id="empty-heading">No products found</h2>
          <p>Adjust the search or filters and try again.</p>
        </section>
      )}
      {data !== undefined && data.items.length > 0 && (
        <>
          <p aria-live="polite">
            {data.pagination.totalItems} product
            {data.pagination.totalItems === 1 ? '' : 's'} found
          </p>
          <div className={styles.tableContainer}>
            <table>
              <caption className={styles.visuallyHidden}>
                Product catalog
              </caption>
              <thead>
                <tr>
                  <th scope="col">SKU</th>
                  <th scope="col">Name</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => (
                  <tr key={product.id}>
                    <td>{product.sku}</td>
                    <th scope="row">{product.name}</th>
                    <td>{product.category}</td>
                    <td>{currency.format(product.priceCents / 100)}</td>
                    <td>{product.stockQuantity}</td>
                    <td>{product.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className={styles.pagination} aria-label="Product pagination">
            <button
              type="button"
              disabled={data.pagination.page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
