import { drawing, figure } from './drawing.js';

function pod(d, x, y, name, address, ready = true, width = 190) {
  const frame = d.rect(x, y, width, 120, '$background', ready ? '$secondary' : '$accent', 12);
  // Pod boundary contains containers; the identity belongs to the Pod, not its host.
  d.rect(x + 16, y + 17, 34, 28, '#22566a', '$secondary', 3);
  d.rect(x + 55, y + 17, 34, 28, '#22566a', '$secondary', 3);
  d.circle(x + width - 23, y + 29, 5, ready ? '$secondary' : '$accent', 'none');
  d.text(name, x + 16, y + 56, width - 30, 22, '$ink', 'semibold', { container: frame.id });
  d.text(address, x + 16, y + 87, width - 30, 18, '$muted', 'regular', { container: frame.id });
}

export function kubernetes() {
  const control = drawing('control-plane', 52, 180, 850, 826);
  control.heading('01', 'Declare intent; reconcile state', 'A Deployment asks for three replicas. Controllers keep that intent alive.');
  control.rect(0, 118, 850, 708, '$panel', '$line', 14);
  control.label('CONTROL PLANE', 24, 137, 440);
  // The manifest and persisted resources are first-class visual objects.
  control.rect(24, 200, 207, 128, '$background', '$warm', 5);
  control.text('Deployment', 39, 215, 175, 24, '$warm', 'semibold');
  control.text('replicas: 3\napp: web', 39, 257, 175, 22);
  control.arrow(241, 260, 295, 260, '$warm', 3);
  control.card('API server', 'Validate and expose\ncluster resources.', 305, 200, 266, '$warm', 128);
  control.arrow(581, 260, 630, 260, '$warm', 3);
  control.rect(640, 200, 186, 128, '$background', '$line', 8);
  control.ellipse(733, 219, 62, 14, '$panel', '$muted', 1.5);
  control.path('M671 219 V253 Q733 282 795 253 V219', '$muted', 1.5);
  control.text('etcd', 662, 281, 142, 22, '$ink', 'semibold', { align: 'center' });
  control.label('SUBMIT', 236, 169, 95, '$warm');
  control.label('PERSIST', 583, 169, 99, '$warm');

  control.route([[410, 331], [410, 378], [213, 378], [213, 442]], '$warm', 3);
  control.route([[465, 331], [465, 378], [638, 378], [638, 442]], '$warm', 3);
  control.text('Watch + reconcile', 42, 339, 320, 21, '$warm');
  control.text('Watch unassigned Pods', 501, 339, 315, 21, '$warm');
  control.card('Controller manager', 'Deployment and ReplicaSet\ncontrollers maintain replicas.', 24, 452, 377, '$warm', 151);
  control.card('Scheduler', 'Choose a suitable node;\nwrite the Pod binding via API.', 449, 452, 377, '$warm', 151);

  control.label('OWNERSHIP OF API OBJECTS', 24, 642, 790, '$secondary');
  const resourceY = 690;
  control.rect(24, resourceY, 222, 71, '$background', '$secondary', 5);
  control.text('Deployment', 38, resourceY + 20, 190, 22);
  control.arrow(256, resourceY + 36, 287, resourceY + 36, '$secondary', 3);
  control.rect(297, resourceY, 222, 71, '$background', '$secondary', 5);
  control.text('ReplicaSet', 311, resourceY + 20, 190, 22);
  control.arrow(529, resourceY + 36, 560, resourceY + 36, '$secondary', 3);
  for (let i = 2; i >= 0; i--) control.rect(570 + i * 14, resourceY - i * 9, 203, 71, '$background', '$secondary', 5);
  control.text('3 Pod objects', 583, resourceY + 20, 176, 22);
  control.text('Controllers and scheduler communicate through the API.', 24, 786, 803, 21, '$muted');

  const nodes = drawing('execution', 960, 180, 788, 826);
  nodes.heading('02', 'Run the assigned Pods', 'Kubelets observe bindings; runtimes create containers on each node.');
  nodes.rect(0, 118, 788, 467, '$panel', '$line', 14);
  nodes.label('WORKER NODE A • SMALL TILES INSIDE PODS ARE CONTAINERS', 24, 137, 750);
  nodes.card('kubelet', 'Observe assigned Pods\nand report status to API.', 24, 198, 331, '$warm', 146);
  nodes.card('Container runtime', 'Create and supervise\ncontainers through CRI.', 433, 198, 331, '$warm', 146);
  nodes.arrow(365, 266, 422, 266, '$warm', 3);
  nodes.label('CRI', 371, 220, 59, '$warm');
  nodes.route([[599, 347], [599, 385], [389, 385]], '$warm', 3);
  nodes.route([[389, 385], [182, 385], [182, 420]], '$warm', 3);
  nodes.arrow(599, 385, 599, 420, '$warm', 3);
  pod(nodes, 56, 427, 'web-a', '10.244.1.8', true, 255);
  pod(nodes, 477, 427, 'web-b', '10.244.1.9', true, 255);
  nodes.rect(0, 619, 788, 207, '$panel', '$line', 14);
  nodes.label('WORKER NODE B', 24, 638, 400);
  nodes.text('Own kubelet + runtime\nSame desired workload,\ndifferent host and Pod IP.', 24, 684, 420, 23, '$muted');
  pod(nodes, 477, 681, 'web-c', '10.244.2.5', true, 255);

  const network = drawing('service-traffic', 52, 1070, 1060, 584);
  network.heading('03', 'A stable Service fronts changing endpoints', 'Application traffic follows the data plane. It does not traverse the API server.');
  network.label('CONTROL CONFIGURATION', 0, 111, 550, '$warm');
  network.card('Service + EndpointSlices', 'Selector: app=web • eligible Pod addresses', 0, 152, 564, '$warm');
  network.route([[575, 205], [654, 205], [654, 278]], '$warm', 3);
  network.text('kube-proxy watches objects\nand installs forwarding rules', 623, 123, 420, 22, '$warm');
  network.text('CLIENT', 0, 329, 185, 20, '$secondary', 'semibold');
  network.rect(0, 365, 155, 88, '$panel', '$line', 6);
  network.text('Request', 19, 389, 128, 25);
  network.arrow(166, 410, 237, 410, '$secondary', 4);
  network.rect(248, 365, 225, 88, '$panel', '$secondary', 8);
  network.text('Service VIP', 264, 379, 195, 24, '$ink', 'semibold');
  network.text('10.96.0.20', 264, 417, 192, 20, '$muted');
  network.arrow(484, 410, 560, 410, '$secondary', 4);
  network.rect(571, 290, 165, 210, '$panel', '$secondary', 8);
  network.text('Node\nforwarding\nrules', 589, 350, 133, 23, '$ink', 'semibold');
  network.route([[747, 383], [789, 383], [789, 335], [843, 335]], '$secondary', 4);
  network.route([[747, 430], [809, 430], [809, 477], [843, 477]], '$secondary', 4);
  pod(network, 854, 281, 'web-a / A', '10.244.1.8', true, 205);
  pod(network, 854, 423, 'web-c / B', '10.244.2.5', true, 205);
  network.text('One eligible endpoint per connection • two possible targets shown', 0, 551, 1050, 22, '$muted');

  const repair = drawing('replacement', 1168, 1070, 580, 584);
  repair.heading('04', 'Replace a lost Pod', 'The replica target stays at three. Pod identity and addresses can change.');
  const dotRow = (x, y, dead) => { for (let i = 0; i < 3; i++) {
    repair.rect(x + i * 57, y, 43, 43, i === dead ? '$panel' : '#22566a', i === dead ? '$accent' : '$secondary', 5);
    if (i === dead) { repair.line(x + i * 57 + 9, y + 9, x + i * 57 + 34, y + 34, '$accent', 2); repair.line(x + i * 57 + 34, y + 9, x + i * 57 + 9, y + 34, '$accent', 2); }
  } };
  repair.label('OBSERVED', 0, 137, 250, '$accent');
  dotRow(0, 180, 1);
  repair.text('2 remain', 222, 184, 350, 28, '$accent', 'semibold');
  repair.arrow(81, 240, 81, 290, '$warm', 3);
  repair.text('ReplicaSet creates a new Pod;\nscheduler and kubelet place and run it.', 126, 254, 454, 23, '$muted');
  repair.label('RECONCILED', 0, 346, 320);
  dotRow(0, 388, -1);
  repair.text('3 again', 222, 392, 350, 28, '$secondary', 'semibold');
  repair.line(0, 464, 580, 464);
  repair.text('EndpointSlices update as endpoints change.\nThe Service address remains stable.', 0, 496, 580, 23);

  return figure('Kubernetes: from declared replicas to live traffic', 'Four connected views of the same workload: control, execution, networking and replacement. Example: a three-replica web Deployment.', 'FIELD ATLAS    /    03 — PUBLIC SYSTEM ARCHITECTURE', 1740, [
    { title: 'Kubernetes — Cluster Architecture', url: 'https://kubernetes.io/docs/concepts/architecture/' },
    { title: 'Kubernetes — Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
    { title: 'Kubernetes — Virtual IPs and Service Proxies', url: 'https://kubernetes.io/docs/reference/networking/virtual-ips/' },
    { title: 'Kubernetes — Connecting Applications with Services', url: 'https://kubernetes.io/docs/tutorials/services/connect-applications-service/' }
  ], [control, nodes, network, repair], 'Sources: kubernetes.io • kube-proxy-based example; other data planes exist • IPs and placement are illustrative • Storage, ingress and HA are outside this view');
}
