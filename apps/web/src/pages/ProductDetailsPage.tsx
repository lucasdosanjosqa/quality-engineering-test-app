import type { ProductDetail } from '@commerceops/contracts';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import styles from '../App.module.css';
import { deleteProduct, getProduct } from '../api/client';
import { useAuth } from '../auth/useAuth';

type DetailState =
  | { status: 'loading' }
  | { status: 'success'; product: ProductDetail }
  | { status: 'error' };

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function ProductDetailsPage() {
  const { id = '' } = useParams();
  const { state: authState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getProduct(id, controller.signal)
      .then((product) => setState({ status: 'success', product }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setState({ status: 'error' });
        }
      });
    return () => controller.abort();
  }, [id]);

  async function handleDelete(): Promise<void> {
    setDeleteError(false);
    try {
      await deleteProduct(id);
      void navigate('/products', {
        replace: true,
        state: { notice: 'Product deleted.' },
      });
    } catch {
      setDeleteError(true);
      setConfirmingDelete(false);
    }
  }

  if (state.status === 'loading') return <p role="status">Loading product…</p>;
  if (state.status === 'error')
    return <p role="alert">The product could not be loaded.</p>;

  const { product } = state;
  const isAdmin =
    authState.status === 'authenticated' && authState.user.role === 'admin';
  const notice = (location.state as { notice?: string } | null)?.notice;

  return (
    <main className={styles.pageLayout}>
      <nav aria-label="Breadcrumb">
        <Link to="/products">Products</Link> / <span>{product.name}</span>
      </nav>
      {notice !== undefined && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {deleteError && <p role="alert">The product could not be deleted.</p>}
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{product.sku}</p>
          <h1>{product.name}</h1>
        </div>
        {isAdmin && (
          <div className={styles.actions}>
            <Link
              className={styles.buttonLink}
              to={`/products/${product.id}/edit`}
            >
              Edit
            </Link>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          </div>
        )}
      </header>
      <dl className={styles.detailGrid}>
        <div>
          <dt>Description</dt>
          <dd>{product.description}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{product.category}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{currency.format(product.priceCents / 100)}</dd>
        </div>
        <div>
          <dt>Stock</dt>
          <dd>{product.stockQuantity}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{product.status}</dd>
        </div>
      </dl>
      {confirmingDelete && (
        <div className={styles.modalBackdrop}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete product?</h2>
            <p>This permanently deletes {product.name}.</p>
            <div className={styles.actions}>
              <button type="button" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={() => void handleDelete()}
              >
                Confirm delete
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
