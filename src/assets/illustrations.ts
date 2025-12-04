/* Mental Health Illustrations - SVG Data URIs */

export const illustrations = {
  meditation: `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='200' cy='180' r='50' fill='%238b5cf6' opacity='0.2'/%3E%3Ccircle cx='200' cy='160' r='30' fill='%238b5cf6' opacity='0.3'/%3E%3Cellipse cx='200' cy='220' rx='40' ry='60' fill='%238b5cf6' opacity='0.25'/%3E%3Ccircle cx='170' cy='250' r='25' fill='%238b5cf6' opacity='0.2'/%3E%3Ccircle cx='230' cy='250' r='25' fill='%238b5cf6' opacity='0.2'/%3E%3Cpath d='M140 280 Q130 300 140 320' stroke='%238b5cf6' stroke-width='3' fill='none' opacity='0.3'/%3E%3Cpath d='M260 280 Q270 300 260 320' stroke='%238b5cf6' stroke-width='3' fill='none' opacity='0.3'/%3E%3C/svg%3E`,
  
  mindfulness: `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='200' cy='200' r='80' fill='%2322c55e' opacity='0.1'/%3E%3Ccircle cx='200' cy='200' r='60' fill='%2322c55e' opacity='0.15'/%3E%3Ccircle cx='200' cy='200' r='40' fill='%2322c55e' opacity='0.2'/%3E%3Ccircle cx='200' cy='200' r='20' fill='%2322c55e' opacity='0.3'/%3E%3Cpath d='M150 150 Q200 100 250 150' stroke='%2322c55e' stroke-width='2' opacity='0.4'/%3E%3Cpath d='M250 250 Q200 300 150 250' stroke='%2322c55e' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E`,
  
  wellness: `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='200' cy='150' r='40' fill='%23ec4899' opacity='0.2'/%3E%3Cpath d='M160 190 Q200 230 240 190' fill='%23ec4899' opacity='0.2'/%3E%3Ccircle cx='175' cy='170' r='15' fill='%23ec4899' opacity='0.3'/%3E%3Ccircle cx='225' cy='170' r='15' fill='%23ec4899' opacity='0.3'/%3E%3Cpath d='M150 250 Q200 280 250 250' stroke='%23ec4899' stroke-width='3' opacity='0.3'/%3E%3C/svg%3E`,
  
  growth: `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M200 300 L200 150' stroke='%2306b6d4' stroke-width='4' opacity='0.3'/%3E%3Cellipse cx='200' cy='130' rx='30' ry='40' fill='%2306b6d4' opacity='0.2'/%3E%3Cellipse cx='170' cy='180' rx='25' ry='35' fill='%2306b6d4' opacity='0.15'/%3E%3Cellipse cx='230' cy='180' rx='25' ry='35' fill='%2306b6d4' opacity='0.15'/%3E%3Cellipse cx='150' cy='220' rx='20' ry='30' fill='%2306b6d4' opacity='0.1'/%3E%3Cellipse cx='250' cy='220' rx='20' ry='30' fill='%2306b6d4' opacity='0.1'/%3E%3C/svg%3E`,
  
  therapy: `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M200 120 Q180 140 200 160 Q220 140 200 120 Z' fill='%23f97316' opacity='0.3'/%3E%3Ccircle cx='170' cy='180' r='30' fill='%23f97316' opacity='0.2'/%3E%3Ccircle cx='230' cy='180' r='30' fill='%23f97316' opacity='0.2'/%3E%3Cpath d='M150 240 Q200 280 250 240' stroke='%23f97316' stroke-width='3' opacity='0.3'/%3E%3Cellipse cx='200' cy='300' rx='60' ry='20' fill='%23f97316' opacity='0.1'/%3E%3C/svg%3E`,
  
  journal: `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='120' y='100' width='160' height='200' rx='8' fill='%23eab308' opacity='0.2'/%3E%3Cline x1='150' y1='150' x2='250' y2='150' stroke='%23eab308' stroke-width='2' opacity='0.3'/%3E%3Cline x1='150' y1='180' x2='250' y2='180' stroke='%23eab308' stroke-width='2' opacity='0.3'/%3E%3Cline x1='150' y1='210' x2='220' y2='210' stroke='%23eab308' stroke-width='2' opacity='0.3'/%3E%3Cline x1='150' y1='240' x2='240' y2='240' stroke='%23eab308' stroke-width='2' opacity='0.3'/%3E%3C/svg%3E`
};

export const moodIllustrations = {
  1: illustrations.wellness,   // Terrible
  2: illustrations.therapy,    // Bad
  3: illustrations.mindfulness, // Okay
  4: illustrations.growth,     // Good
  5: illustrations.meditation  // Great
};
