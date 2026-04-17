/** Справочник для UI, если /api/vehicle-types недоступен или пустой (как в seed API). */
export type VehicleTypeRow = {
  id: string
  code: string
  name: string
  tariff: {
    ratePerKm: string
    minimumTotal: string
    currency: string
  } | null
}

export const VEHICLE_TYPES_FALLBACK: VehicleTypeRow[] = [
  {
    id: '__demo-1__',
    code: 'gazelle',
    name: 'Газель (фургон, до ~1,5 т)',
    tariff: {
      ratePerKm: '35',
      minimumTotal: '2500',
      currency: 'RUB',
    },
  },
  {
    id: '__demo-2__',
    code: 'truck_5t',
    name: 'Грузовик (до 5 т)',
    tariff: {
      ratePerKm: '48',
      minimumTotal: '4000',
      currency: 'RUB',
    },
  },
  {
    id: '__demo-3__',
    code: 'truck_20t',
    name: 'Фура / тент (до 20 т)',
    tariff: {
      ratePerKm: '62',
      minimumTotal: '9000',
      currency: 'RUB',
    },
  },
]
