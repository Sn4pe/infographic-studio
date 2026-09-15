import { drawing, figure } from './drawing.js';

// Abstract duplex: rungs are visual units, not a real nucleotide sequence.
function duplex(d, x, y, count, { gap = -1, edited = [], step = 28 } = {}) {
  for (let i = 0; i < count; i++) {
    const xx = x + i * step;
    if (i === gap) continue;
    const colour = edited.includes(i) ? '$accent' : '$secondary';
    d.line(xx, y, xx, y + 36, colour, 5, { geometryRole: 'illustration' });
    if (i < count - 1 && i + 1 !== gap) {
      d.line(xx, y, xx + step, y, '$secondary', 4);
      d.line(xx, y + 36, xx + step, y + 36, '$secondary', 4);
    }
  }
}

export function crispr() {
  const recognition = drawing('recognition', 52, 182, 1696, 650);
  recognition.heading('01', 'Recognition is a molecular fit', 'The guide pairs with one DNA strand while Cas9 holds the locally opened duplex.');
  recognition.path('M246 276 C170 163 303 93 438 139 C552 74 701 124 741 145 C882 103 1043 223 997 359 C1074 479 934 598 795 569 C679 643 506 598 452 558 C300 606 175 456 246 276 Z', '#91aeb0', 2, '#e0e9e4');
  recognition.text('Cas9', 475, 149, 230, 49, '$ink', 'semibold');
  recognition.label('PROTEIN ENVELOPE', 440, 222, 310, '$muted');
  // A locally displaced strand, an RNA–DNA hybrid and a neighbouring PAM.
  recognition.path('M24 330 H245 C290 330 301 275 355 275 H714 M747 275 H782 C826 275 815 330 858 330 H1070', '$secondary', 6);
  recognition.path('M24 402 H714 M747 402 H1070', '$secondary', 6);
  for (let x = 38; x < 243; x += 27) recognition.line(x, 331, x, 401, '#77a8ae', 3);
  for (let x = 867; x < 1070; x += 27) recognition.line(x, 331, x, 401, '#77a8ae', 3);
  recognition.rect(855, 320, 88, 94, '#efe1bf', '$warm', 6);
  for (let x = 867; x < 943; x += 27) recognition.line(x, 331, x, 401, '$warm', 5);
  recognition.path('M812 369 H385 C348 369 340 422 366 453 C390 480 409 508 380 526 C352 543 326 508 346 491 C317 468 290 488 298 519 C296 559 245 554 253 525', '$accent', 6);
  for (let x = 402; x < 813; x += 27) recognition.line(x, 371, x, 399, '$accent', 3);
  recognition.label('DNA', 28, 437, 180);
  recognition.label('GUIDE RNA', 414, 472, 255, '$accent');
  recognition.label('PAM', 862, 452, 130, '$warm');
  recognition.line(896, 423, 896, 445, '$warm', 1.5);
  recognition.text('Paired region', 443, 315, 264, 22, '$accent', 'semibold');
  // Cut ticks identify two strands without drawing a connector through the hybrid label.
  for (const y of [275, 402]) {
    recognition.line(723, y - 13, 737, y + 13, '$accent', 3);
    recognition.line(737, y - 13, 723, y + 13, '$accent', 3);
  }
  recognition.text('Two strands cut', 674, 525, 300, 23, '$ink', 'semibold');
  recognition.path('M732 422 V498 H818 V515', '$muted', 1.5);
  recognition.text('Strand separation and protein shape are schematic.', 18, 613, 1040, 19, '$muted');

  recognition.line(1120, 130, 1120, 595, '$line', 2);
  recognition.label('A LANDMARK', 1172, 139, 500, '$warm');
  recognition.text('PAM is adjacent DNA', 1172, 175, 510, 28, '$ink', 'semibold');
  recognition.text('Cas9 requires a compatible motif next to the target.', 1172, 226, 510, 24, '$muted');
  recognition.label('A MATCH', 1172, 328, 500, '$accent');
  recognition.text('The RNA supplies specificity', 1172, 363, 510, 28, '$ink', 'semibold');
  recognition.text('Complementary pairing positions the nuclease. Similar sites can still be cut.', 1172, 448, 510, 24, '$muted');

  const repair = drawing('repair', 52, 891, 1696, 659);
  repair.heading('02', 'A cut is the beginning of an edit', 'The cell repairs the break through competing pathways; these are two simplified outcomes.');
  duplex(repair, 640, 112, 16, { gap: 8 });
  repair.line(848, 164, 848, 192, '$muted', 2);
  repair.route([[848, 192], [395, 192], [395, 237]], '$muted', 2.5);
  repair.route([[848, 192], [1260, 192], [1260, 237]], '$muted', 2.5);
  repair.text('End joining', 0, 258, 765, 29, '$ink', 'semibold');
  repair.text('Reconnect the broken ends', 0, 303, 765, 23, '$muted');
  repair.line(636, 341, 636, 505, '$line', 1.5, { dash: [3, 6], geometryRole: 'illustration' });
  repair.label('ORIGINAL END', 595, 510, 202, '$muted');
  repair.text('Deletion', 0, 377, 184, 22);
  duplex(repair, 216, 368, 14);
  repair.path('M384 368 H412 M384 404 H412', '$accent', 4);
  repair.text('Insertion', 0, 465, 184, 22);
  duplex(repair, 216, 456, 18, { edited: [7, 8] });
  repair.text('Different small changes may disrupt gene function; some repairs restore the original sequence.', 0, 543, 753, 23, '$muted');

  repair.line(837, 263, 837, 631, '$line', 2);
  repair.text('Template-directed repair', 899, 258, 797, 29, '$ink', 'semibold');
  repair.text('Copy information from matching DNA', 899, 303, 797, 23, '$muted');
  repair.label('TEMPLATE', 900, 369, 184, '$warm');
  duplex(repair, 1132, 357, 16, { edited: [7] });
  repair.arrow(1330, 408, 1330, 439, '$warm', 2.5);
  repair.label('REPAIRED', 900, 466, 184);
  duplex(repair, 1132, 456, 16, { edited: [7] });
  repair.text('A defined change can be copied into the target. Cleavage alone does not guarantee this outcome.', 899, 543, 787, 23, '$muted');

  return figure('CRISPR–Cas9: targeting is only half the story', 'RNA-guided recognition locates a break. DNA repair determines what the genome becomes.', 'FIELD ATLAS    /    05 — MOLECULAR BIOLOGY', 1640, [
    { title: 'Addgene — CRISPR Guide', url: 'https://www.addgene.org/guides/crispr/' },
    { title: 'NHGRI — CRISPR', url: 'https://www.genome.gov/genetics-glossary/CRISPR' }
  ], [recognition, repair], 'Sources: Addgene / NHGRI • Conventional cutting Cas9 • Abstract sequence units, not a target sequence or a molecular-scale model', 'paper');
}
