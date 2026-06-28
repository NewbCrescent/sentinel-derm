import { Search } from "lucide-react";

import { conditionLabels, type PatientListParams } from "@/types/patient";

const conditionOptions = Object.entries(conditionLabels);

export function PatientFilters({ params }: { params: PatientListParams }) {
  return (
    <form action="/patients" className="filters">
      <label className="filter-group">
        <span>Status</span>
        <select defaultValue={params.status} name="status">
          <option value="open">Open</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
      </label>
      <label className="filter-group">
        <span>Condition</span>
        <select defaultValue={params.condition[0] ?? ""} name="condition">
          <option value="">Any</option>
          {conditionOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="filter-group">
        <span>Sort</span>
        <select defaultValue={params.sort} name="sort">
          <option value="recent">Recent</option>
          <option value="urgency">Urgency</option>
        </select>
      </label>
      <label className="filter-group">
        <span>Order</span>
        <select defaultValue={params.order} name="order">
          <option value="desc">High to low</option>
          <option value="asc">Low to high</option>
        </select>
      </label>
      <button className="button" type="submit">
        <Search aria-hidden="true" size={16} />
        Apply
      </button>
    </form>
  );
}
