/**
 * Demo media comes from Unsplash (Unsplash License: free to use, no attribution required).
 * Keys describe the photo so templates can pick fitting imagery.
 */
export const PHOTOS = {
  watch: '1523275335684-37898b6baf30',
  feast: '1504674900247-0877df9cc836',
  valley: '1469474968028-56623f02e42e',
  beach: '1507525428034-b723cf961d3e',
  rack: '1490481651871-ab68de25d43d',
  yellowFit: '1515886657613-9f3515b0c78f',
  floral: '1496747611176-843222e1e57c',
  salad: '1540189549336-e6e99c3679fe',
  pizzaBoard: '1565299624946-b28f40a0ae38',
  eggToast: '1482049016688-2d3e1b311543',
  boatLake: '1476514525535-07fb3b4ae5f1',
  travelFlat: '1488646953014-85cb44e25828',
  turquoiseLake: '1501785888041-af3ef285b470',
  photographer: '1492691527719-9d1e07e534b4',
  friendsSunset: '1511632765486-a01980e01a18',
  confettiCrowd: '1492684223066-81342ee5ff30',
  headphones: '1505740420928-5e560c06d30e',
  instantCam: '1526170375885-4d8ecf77b99f',
  serum: '1556228578-8c89e6adf883',
  redTee: '1529139574466-a303027c1d8b',
  denim: '1517841905240-472988babdf9',
  portraitA: '1534528741775-53994a69daeb',
  portraitB: '1507003211169-0a1dd7228f2d',
  portraitC: '1494790108377-be9c29b29330',
  portraitD: '1500648767791-00dcc994a43e',
  portraitE: '1438761681033-6461ffad8d80',
  bbq: '1555939594-58d7cb561ad1',
  dinner: '1414235077428-338989a2e8c0',
  salmon: '1467003909585-2f8a72700288',
  parisNight: '1499856871958-5b9627545d1a',
  eiffel: '1502602898657-3e91760cbb34',
  balloons: '1530789253388-582c481c54b0',
  peaks: '1506905925346-21bda4d32df4',
  store: '1441986300917-64674bd600d8',
  shopper: '1483985988355-763728e1935b',
  tealFashion: '1509631179647-0177331693ae',
  streetCoat: '1485968579580-b6d095142e6e',
  pizza: '1513104890138-7c749659a591',
  cocktails: '1551024709-8f23befc6f87',
  coffee: '1495474472287-4d71bcdd2085',
  dj: '1470225620780-dba8ba36b745',
  concert: '1459749411175-04bf5292ceea',
  stage: '1516450360452-9312f5e86fc7',
  shirts: '1523381210434-271e8be1f52b',
  pinkWall: '1503342217505-b0a15ec3261c',
  sneakersColor: '1560769629-975ec94e6a86',
  fitness: '1571019613454-1cb2f99b2d8b',
  yoga: '1544367567-0f2fcb009e0b',
  milkyWay: '1519681393784-d120267933ba',
  city: '1477959858617-67f85cf4f1df',
  party: '1533174072545-7a4b6ad7a6c3',
  videographer: '1558618666-fcd25c85cd64',
  bags: '1607082348824-0a96f2a4b9da',
} as const

export type PhotoKey = keyof typeof PHOTOS

export function photoUrl(id: string, width: number, height?: number): string {
  const h = height ? `&h=${height}` : ''
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}${h}&q=70`
}
