// Unit conversion utility functions

// Define conversion factors for common units
type WeightUnit = 'kg' | 'g' | 'mg' | 'lb' | 'oz';
type VolumeUnit = 'l' | 'ml' | 'cup' | 'tbsp' | 'tsp';

const weightConversions: Record<WeightUnit, number> = {
  kg: 1000,    // 1 kg = 1000 g
  g: 1,        // Base unit
  mg: 0.001,   // 1 mg = 0.001 g
  lb: 453.592, // 1 lb = 453.592 g
  oz: 28.3495  // 1 oz = 28.3495 g
};

const volumeConversions: Record<VolumeUnit, number> = {
  l: 1000,     // 1 l = 1000 ml
  ml: 1,       // Base unit
  cup: 236.588, // 1 cup = 236.588 ml
  tbsp: 14.7868, // 1 tbsp = 14.7868 ml
  tsp: 4.92892  // 1 tsp = 4.92892 ml
};

// Function to convert between units of the same type
export function convertUnits(value: number, fromUnit: string, toUnit: string): number | null {
  // Normalize units to lowercase
  const normalizedFromUnit = fromUnit.toLowerCase();
  const normalizedToUnit = toUnit.toLowerCase();
  
  // If units are the same, no conversion needed
  if (normalizedFromUnit === normalizedToUnit) {
    return value;
  }
  
  // Check if both units are weight units
  const isFromWeight = Object.keys(weightConversions).includes(normalizedFromUnit as WeightUnit);
  const isToWeight = Object.keys(weightConversions).includes(normalizedToUnit as WeightUnit);
  
  if (isFromWeight && isToWeight) {
    const fromFactor = weightConversions[normalizedFromUnit as WeightUnit];
    const toFactor = weightConversions[normalizedToUnit as WeightUnit];
    return value * (fromFactor / toFactor);
  }
  
  // Check if both units are volume units
  const isFromVolume = Object.keys(volumeConversions).includes(normalizedFromUnit as VolumeUnit);
  const isToVolume = Object.keys(volumeConversions).includes(normalizedToUnit as VolumeUnit);
  
  if (isFromVolume && isToVolume) {
    const fromFactor = volumeConversions[normalizedFromUnit as VolumeUnit];
    const toFactor = volumeConversions[normalizedToUnit as VolumeUnit];
    return value * (fromFactor / toFactor);
  }
  
  // If we reach here, units are not compatible or not supported
  return null;
}

// Function to check if units are compatible for conversion
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  // Normalize units to lowercase
  const normalizedUnit1 = unit1.toLowerCase();
  const normalizedUnit2 = unit2.toLowerCase();
  
  // If units are the same, they are compatible
  if (normalizedUnit1 === normalizedUnit2) {
    return true;
  }
  
  // Check if both are weight units
  const isUnit1Weight = Object.keys(weightConversions).includes(normalizedUnit1 as WeightUnit);
  const isUnit2Weight = Object.keys(weightConversions).includes(normalizedUnit2 as WeightUnit);
  const bothAreWeightUnits = isUnit1Weight && isUnit2Weight;
  
  // Check if both are volume units
  const isUnit1Volume = Object.keys(volumeConversions).includes(normalizedUnit1 as VolumeUnit);
  const isUnit2Volume = Object.keys(volumeConversions).includes(normalizedUnit2 as VolumeUnit);
  const bothAreVolumeUnits = isUnit1Volume && isUnit2Volume;
  
  return bothAreWeightUnits || bothAreVolumeUnits;
}
