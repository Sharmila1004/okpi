import Button from "./Button";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="secondary"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
