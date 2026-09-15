import { drawing, figure } from './drawing.js';

function log(d, x, y, { start = 40, count = 4, step = 44, highlight = -1, colour = '$secondary' } = {}) {
  for (let i = 0; i < count; i++) {
    const cell = d.rect(x + i * step, y, step - 4, 42, i === highlight ? '#f0d6cc' : '#e1ece9', colour, 3);
    d.text(String(start + i), x + i * step + 3, y + 8, step - 10, 19, '$ink', 'semibold', { align: 'center', container: cell.id });
  }
}

export function kafka() {
  const placement = drawing('replica-placement', 52, 182, 988, 639);
  placement.heading('01', 'One topic, three ordered logs', 'Rows are partitions. Columns are brokers. Every partition has three replicas.');
  for (let b = 0; b < 3; b++) {
    const x = 150 + b * 280;
    const broker = placement.rect(x, 118, 260, 439, '$panel', '$line', 12);
    placement.text(`Broker ${b + 1}`, x + 21, 139, 218, 27, '$ink', 'semibold', { container: broker.id });
    for (let p = 0; p < 3; p++) {
      const y = 223 + p * 111;
      placement.label(p === b ? 'LEADER' : 'FOLLOWER', x + 22, y - 28, 218, p === b ? '$secondary' : '$muted');
      log(placement, x + 23, y, { step: 54, highlight: 3, colour: p === b ? '$secondary' : '#a6b9b7' });
    }
  }
  for (let p = 0; p < 3; p++) {
    placement.text(`P${p}`, 10, 222 + p * 111, 110, 35, '$ink', 'semibold');
  }
  placement.text('Offsets order records within each partition. There is no single topic-wide order.', 0, 587, 975, 24, '$muted');

  const replication = drawing('replication-detail', 1120, 182, 628, 639);
  replication.heading('02', 'Zoom into partition P0', 'Arrows show record transfer; followers fetch from the leader.');
  replication.text('Producer', 0, 154, 157, 25, '$ink', 'semibold');
  replication.arrow(156, 173, 224, 173, '$accent', 3);
  replication.label('B1 · LEADER', 242, 113, 376);
  log(replication, 242, 151, { step: 73, highlight: 3 });
  replication.line(385, 201, 385, 242, '$secondary', 3);
  replication.path('M385 242 H186 V461', '$secondary', 3);
  replication.arrow(186, 336, 230, 336, '$secondary', 3);
  replication.arrow(186, 461, 230, 461, '$secondary', 3);
  replication.label('B2 · FOLLOWER', 242, 284, 376);
  log(replication, 242, 315, { step: 73, highlight: 3 });
  replication.label('B3 · FOLLOWER', 242, 409, 376);
  log(replication, 242, 440, { step: 73, highlight: 3 });
  replication.text('Same\nrecords', 0, 348, 159, 23, '$secondary', 'semibold');
  replication.text('acks=all  ·  min.insync.replicas=2', 0, 531, 628, 25, '$ink', 'semibold');
  replication.text('All current ISR members must replicate the write; fewer than two means failure.', 0, 575, 628, 23, '$muted');

  const consumption = drawing('consumer-progress', 52, 897, 1696, 495);
  consumption.heading('03', 'Consumers move; retained records stay', 'Two independent standard consumer groups read the same topic, each with its own progress.');
  // An aligned ruler makes offsets and consumer cursors comparable without long crossing arrows.
  consumption.label('P0 · ONE SHARED LOG', 0, 132, 352);
  log(consumption, 393, 123, { start: 40, count: 10, step: 94, highlight: 9 });
  consumption.label('APPEND', 1410, 132, 274, '$accent');
  consumption.arrow(1348, 145, 1395, 145, '$accent', 3);
  const cursor = (x, y, colour) => {
    consumption.line(393, y, 1329, y, '$line', 2);
    consumption.polygon([[x, y - 10], [x - 9, y + 9], [x + 9, y + 9]], colour, 'none');
  };
  consumption.text('Billing group', 0, 220, 340, 27, '$ink', 'semibold');
  consumption.text('P0 assigned to consumer A', 0, 265, 345, 21, '$muted');
  cursor(393 + 7 * 94 + 45, 238, '$secondary');
  consumption.text('Next: 47', 393 + 7 * 94, 267, 248, 22, '$secondary', 'semibold');
  consumption.text('Analytics group', 0, 332, 340, 27, '$ink', 'semibold');
  consumption.text('P0 assigned to consumer X', 0, 377, 345, 21, '$muted');
  cursor(393 + 3 * 94 + 45, 350, '$warm');
  consumption.text('Next: 43', 393 + 3 * 94, 379, 248, 22, '$warm', 'semibold');
  consumption.text('One assigned consumer per partition within each group. Replay is possible while records remain retained.', 393, 443, 1303, 23, '$muted');

  const metadata = drawing('metadata-quorum', 52, 1465, 1696, 461);
  metadata.heading('04', 'Cluster metadata has a different consensus path', 'A dedicated KRaft controller quorum tracks brokers, topics and partition leadership.');
  // Voter state is its own small topology. It does not sit in the producer-to-broker data path.
  const nodes = [[0, 'C1', 'Active controller'], [306, 'C2', 'Voter'], [612, 'C3', 'Voter']];
  for (const [x, id, role] of nodes) {
    const box = metadata.rect(x, 129, 246, 145, '$panel', '$line', 10);
    metadata.text(id, x + 22, 144, 202, 32, '$warm', 'semibold', { container: box.id });
    metadata.text(role, x + 22, 195, 202, 23, '$ink', 'regular', { container: box.id });
    for (let i = 0; i < 6; i++) metadata.rect(x + 22 + i * 32, 241, 24, 10, '#ddc79a', 'none', 1);
  }
  metadata.path('M122 283 V318 H735 V283 M429 318 V283', '$warm', 2.5);
  metadata.label('REPLICATED METADATA LOG', 150, 347, 700, '$warm');
  metadata.text('A majority of three voters tolerates one controller failure.', 0, 396, 887, 24, '$muted');
  metadata.line(937, 129, 937, 438, '$line', 2);
  metadata.text('Two durability mechanisms', 1000, 128, 696, 29, '$ink', 'semibold');
  metadata.text('KRaft commits metadata through a voter majority. Topic records use partition replication and the ISR contract above.', 1000, 185, 696, 24, '$muted');
  metadata.text('Consumer offsets live in a broker-hosted internal topic, __consumer_offsets.', 1000, 302, 696, 24, '$muted');

  return figure('Apache Kafka: four views of a durable event log', 'Partition order, replica copies, independent consumers and metadata consensus are separate parts of the same system.', 'FIELD ATLAS    /    07 — DISTRIBUTED SYSTEMS', 2010, [
    { title: 'Apache Kafka — Source repository', url: 'https://github.com/apache/kafka' },
    { title: 'Apache Kafka 4.3 — Design', url: 'https://kafka.apache.org/43/design/design/' },
    { title: 'Apache Kafka 4.3 — KRaft', url: 'https://kafka.apache.org/43/operations/kraft/' },
    { title: 'Apache Kafka 4.3 — Topic configuration', url: 'https://kafka.apache.org/43/configuration/topic-configs/' }
  ], [placement, replication, consumption, metadata], 'Source: Apache Kafka 4.3 docs • Example: 3 brokers + 3 dedicated controllers, RF=3 • Standard consumer groups; synthetic offsets and replica snapshots', 'paper');
}
