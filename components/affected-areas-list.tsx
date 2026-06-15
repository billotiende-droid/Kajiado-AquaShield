'use client';

interface AffectedAreasListProps {
  location: string;
}

export function AffectedAreasList({ location }: AffectedAreasListProps) {
  const getAffectedAreas = (loc: string): string[] => {
    const areas: Record<string, string[]> = {
      'Kajiado Central': ['Low-lying areas', 'Stream valleys', 'Residential estates'],
      'Magadi': ['Soda lake regions', 'Agricultural land', 'Water collection points'],
      'Loitokitok': ['Mountain slopes', 'Water sources', 'Pastoral grazing areas'],
      'Namanga': ['Border regions', 'Wildlife corridors', 'Seasonal water points'],
      'Isinya': ['Ranch areas', 'Settlement zones', 'Dry riverbeds'],
    };
    return areas[loc] || [];
  };

  const affectedAreas = getAffectedAreas(location);

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Affected Areas</h4>
      <div className="space-y-2">
        {affectedAreas.map((area, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-sm text-slate-700">{area}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
