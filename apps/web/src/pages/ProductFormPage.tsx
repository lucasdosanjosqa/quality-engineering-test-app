import type { ProductDetail, ProductInput } from '@commerceops/contracts';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import styles from '../App.module.css';
import {
  ApiError,
  createProduct,
  getProduct,
  updateProduct,
} from '../api/client';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; product?: ProductDetail }
  | { status: 'error' };

function textValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

export function ProductFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>(
    mode === 'create' ? { status: 'ready' } : { status: 'loading' },
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (mode === 'create') return;
    const controller = new AbortController();
    void getProduct(id, controller.signal)
      .then((product) => setLoadState({ status: 'ready', product }))
      .catch((loadError: unknown) => {
        if (!(
          loadError instanceof DOMException && loadError.name === 'AbortError'
        ))
          setLoadState({ status: 'error' });
      });
    return () => controller.abort();
  }, [id, mode]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const price = Number(textValue(form, 'price'));
    const stock = Number(textValue(form, 'stockQuantity'));
    const input: ProductInput = {
      sku: textValue(form, 'sku'),
      name: textValue(form, 'name'),
      description: textValue(form, 'description'),
      category: form.get('category') as ProductInput['category'],
      priceCents: Math.round(price * 100),
      stockQuantity: stock,
      status: form.get('status') as ProductInput['status'],
    };
    try {
      const product =
        mode === 'create'
          ? await createProduct(input)
          : await updateProduct(id, input);
      void navigate(`/products/${product.id}`, {
        replace: true,
        state: {
          notice: mode === 'create' ? 'Product created.' : 'Product updated.',
        },
      });
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'The product could not be saved.',
      );
      setSubmitting(false);
    }
  }

  if (loadState.status === 'loading')
    return <p role="status">Loading product…</p>;
  if (loadState.status === 'error')
    return <p role="alert">The product could not be loaded.</p>;
  const product = loadState.product;

  return (
    <main id="main-content" className={styles.pageLayout}>
      <nav aria-label="Breadcrumb">
        <Link to="/products">Products</Link> /{' '}
        <span>{mode === 'create' ? 'Create' : 'Edit'}</span>
      </nav>
      <h1>{mode === 'create' ? 'Create product' : 'Edit product'}</h1>
      {error !== undefined && <p role="alert">{error}</p>}
      <form
        className={styles.productForm}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <label htmlFor="sku">SKU</label>
        <input
          id="sku"
          name="sku"
          defaultValue={product?.sku}
          required
          minLength={3}
          maxLength={40}
          pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
        />
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          defaultValue={product?.name}
          required
          minLength={2}
          maxLength={100}
        />
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description}
          required
          minLength={10}
          maxLength={500}
          rows={4}
        />
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          defaultValue={product?.category ?? 'accessories'}
        >
          <option value="accessories">Accessories</option>
          <option value="audio">Audio</option>
          <option value="keyboards">Keyboards</option>
          <option value="monitors">Monitors</option>
          <option value="workspace">Workspace</option>
        </select>
        <label htmlFor="price">Price (USD)</label>
        <input
          id="price"
          name="price"
          type="number"
          defaultValue={
            product === undefined ? '' : (product.priceCents / 100).toFixed(2)
          }
          required
          min="0"
          max="100000"
          step="0.01"
        />
        <label htmlFor="stockQuantity">Stock quantity</label>
        <input
          id="stockQuantity"
          name="stockQuantity"
          type="number"
          defaultValue={product?.stockQuantity}
          required
          min="0"
          max="100000"
          step="1"
        />
        <fieldset>
          <legend>Status</legend>
          <label>
            <input
              type="radio"
              name="status"
              value="active"
              defaultChecked={product?.status !== 'inactive'}
            />{' '}
            Active
          </label>
          <label>
            <input
              type="radio"
              name="status"
              value="inactive"
              defaultChecked={product?.status === 'inactive'}
            />{' '}
            Inactive
          </label>
        </fieldset>
        <div className={styles.actions}>
          <Link
            to={product === undefined ? '/products' : `/products/${product.id}`}
          >
            Cancel
          </Link>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save product'}
          </button>
        </div>
      </form>
    </main>
  );
}
