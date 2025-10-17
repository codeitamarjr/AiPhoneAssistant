// src/utils/prompts.js
const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '—');

const summariseAmenities = (amenities) => {
    if (!amenities) return null;
    const list = Object.entries(amenities)
        .filter(([, v]) => !!v)
        .map(([k]) => k.replace(/[-_]/g, ' '))
        .slice(0, 12);
    return list.length ? list.join(', ') : null;
};

const summarisePolicies = (policies, key) => policies?.[key] ?? policies?.policies?.[key] ?? null;

const summariseUnitLine = (unit) => {
    const parts = [];
    const label = unit.label || unit.identifier || (unit.bedrooms != null ? `${unit.bedrooms} bed` : `Unit ${unit.id}`);
    parts.push(label);

    if (unit.bedrooms != null || unit.bathrooms != null) {
        parts.push(`${unit.bedrooms ?? '—'} bed / ${unit.bathrooms ?? '—'} bath`);
    }

    if (unit.rent) {
        parts.push(`€${unit.rent}/month`);
    }

    if (unit.available_from) {
        parts.push(`from ${unit.available_from}`);
    }

    return `• ${parts.join(' · ')}`;
};

export function buildGreetingFromListing(listing) {
    const buildingName = listing?.building?.name?.trim();
    if (buildingName) {
        return `Thank you for calling to ${buildingName}, how can we help you today?`;
    }

    const title = listing?.title?.trim();
    if (title) {
        return `Thank you for calling to ${title}, how can we help you today?`;
    }

    return `Thank you for calling, how can we help you today?`;
}

export function buildPropertyFacts(listing) {
    if (!listing) {
        return 'No listing matched this dialed number. Ask for the property name or address and collect lead info.';
    }

    const {
        title,
        address,
        postcode,
        summary,
        amenities,
        policies,
        extra_info,
        inventory_scope: scope,
        building,
        unit,
        unit_type: unitType,
        collection,
        listing_details: legacyDetails,
    } = listing;

    const lines = [];

    lines.push(`Listing title: ${title ?? '—'}`);
    if (address) lines.push(`Address: ${address}${postcode ? ` (${postcode})` : ''}`);

    if (building) {
        lines.push(
            `Building: ${building.name ?? '—'}${building.address_line1 ? `, ${building.address_line1}` : ''}${
                building.city ? `, ${building.city}` : ''
            }`
        );
    }

    const amenityText = summariseAmenities(amenities ?? building?.amenities ?? unit?.amenities ?? unitType?.amenities);
    if (amenityText) {
        lines.push(`Key amenities: ${amenityText}`);
    }

    const viewingPolicy = summarisePolicies(policies, 'viewings');
    const applicationPolicy = summarisePolicies(policies, 'application');
    if (viewingPolicy) lines.push(`Viewing policy: ${viewingPolicy}`);
    if (applicationPolicy) lines.push(`Application info: ${applicationPolicy}`);

    if (extra_info?.location?.summary) {
        lines.push(`Neighbourhood: ${extra_info.location.summary}`);
    }

    const description = summary ?? extra_info?.location?.title ?? null;
    if (description) {
        const text = String(description);
        lines.push(`Summary: ${text.length > 600 ? `${text.slice(0, 600)}…` : text}`);
    }

    switch (scope) {
        case 'collection': {
            const info = collection ?? {};
            lines.push(`This listing markets ${info.unit_count ?? collection?.unit_variations?.length ?? 0} units in this building.`);

            if (info.rent_range?.min || info.rent_range?.max) {
                const { min, max } = info.rent_range;
                if (min && max && min !== max) {
                    lines.push(`Rent range: €${min}–€${max} per month depending on the unit.`);
                } else if (min || max) {
                    const rent = min ?? max;
                    lines.push(`Typical rent: €${rent} per month.`);
                }
            }

            if (info.availability) {
                lines.push(`Earliest availability: ${info.availability}.`);
            }

            const variations = info.unit_variations ?? [];
            if (variations.length) {
                lines.push('Inventory highlights:');
                variations.slice(0, 6).forEach((u) => lines.push(summariseUnitLine(u)));
            }
            break;
        }

        case 'unit': {
            const data = unit ?? {};
            lines.push('This call is for a specific unit.');
            lines.push(
                `Rent: €${data.rent ?? legacyDetails?.rent ?? listing.rent ?? '—'} / month, deposit €${
                    data.deposit ?? legacyDetails?.deposit ?? listing.deposit ?? '—'
                }.`
            );
            if (data.available_from || legacyDetails?.available_from || listing.available_from) {
                lines.push(`Available from: ${data.available_from ?? legacyDetails?.available_from ?? listing.available_from ?? '—'}.`);
            }
            lines.push(
                `Beds/Baths: ${data.bedrooms ?? legacyDetails?.bedrooms ?? listing.bedrooms ?? '—'} / ${
                    data.bathrooms ?? legacyDetails?.bathrooms ?? listing.bathrooms ?? '—'
                }.`
            );
            break;
        }

        case 'unit_type': {
            const data = unitType ?? {};
            lines.push(`This listing covers the "${data.name ?? 'unit type'}" template.`);
            if (data.description) lines.push(`Description: ${data.description}`);
            if (data.default_rent) lines.push(`Typical monthly rent: €${data.default_rent}.`);
            if (data.min_lease_months) lines.push(`Minimum lease: ${data.min_lease_months} months.`);

            const examples = (collection?.unit_variations ?? []).slice(0, 5);
            if (examples.length) {
                lines.push('Example units currently available:');
                examples.forEach((u) => lines.push(summariseUnitLine(u)));
            }
            break;
        }

        default: {
            const d = legacyDetails ?? listing;
            lines.push(
                `Rent: €${d.rent ?? '—'} / month, deposit €${d.deposit ?? '—'}, available from ${d.available_from ?? '—'}, minimum lease ${
                    d.min_lease_months ?? '—'
                } months.`
            );
            lines.push(
                `Beds/Baths: ${d.bedrooms ?? '—'} / ${d.bathrooms ?? '—'}, floor area ${d.floor_area_sqm ?? '—'} sqm, BER ${d.ber ?? '—'}.`
            );
            lines.push(`Furnished: ${yesNo(d.furnished)} | Pets: ${yesNo(d.pets_allowed)} | Smoking: ${yesNo(d.smoking_allowed)}`);
            break;
        }
    }

    return lines.filter(Boolean).join('\n');
}
