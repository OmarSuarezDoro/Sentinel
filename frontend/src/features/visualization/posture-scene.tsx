/**
 * @file: posture-scene.tsx
 * @description: Escena Three.js interactiva de sedes, cloud, proveedores y capas
 * @author: omar.suarez@alturanetgroup.com
 * @version: 1.0.0
 * Copyright (c) 2026 Alturanet Group S.L. Todos los derechos reservados.
 * Queda prohibida la reproducción total o parcial sin autorización previa.
 */
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Posture } from "./visualization.types";

type Props = {
  data: Posture;
  selectedId: string;
  layerId: string;
  rotating: boolean;
  resetKey: number;
  onSelect: (id: string) => void;
  onLayer: (id: string) => void;
  onProvider: (id: string) => void;
};

export default function PostureScene(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    current = useRef(props),
    reset = useRef<(() => void) | null>(null);
  current.current = props;
  const focus = useRef<((id: string) => void) | null>(null);
  useEffect(() => {
    focus.current?.(props.selectedId);
  }, [props.selectedId]);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    reset.current?.();
  }, [props.resetKey]);
  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailure(
        "La vista 3D necesita WebGL 2. Puedes explorar todas las ubicaciones y capas desde los controles de esta página.",
      );
      return;
    }
    setFailure("");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Modelo 3D de la infraestructura. Arrastra para girar y usa la rueda para acercarte.",
    );
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#101f35", 0.006);
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      600,
    );
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.enablePan = true;
    orbit.autoRotateSpeed = 0.22;
    orbit.minPolarAngle = 0.25;
    orbit.maxPolarAngle = Math.PI / 2.12;
    orbit.minDistance = 9;
    scene.add(new THREE.AmbientLight("#c0d8ff", 2.1));
    const sun = new THREE.DirectionalLight("#fff2dc", 4.2);
    sun.position.set(5, 14, 8);
    scene.add(sun);
    const blue = new THREE.DirectionalLight("#4b9dff", 3);
    blue.position.set(-12, 6, -8);
    scene.add(blue);
    const group = new THREE.Group();
    scene.add(group);
    const interactive: THREE.Object3D[] = [],
      labels: {
        element: HTMLButtonElement;
        point: THREE.Vector3;
        id: string;
        provider: boolean;
      }[] = [],
      rings: { mesh: THREE.Mesh; nodeId: string; layerId: string }[] = [],
      models: { object: THREE.Group; nodeId: string }[] = [];
    const nodePositions = new Map<string, THREE.Vector3>();
    const count = props.data.nodes.length,
      columns = Math.max(1, Math.ceil(Math.sqrt(count))),
      rows = Math.ceil(count / columns);
    props.data.nodes.forEach((n, i) =>
      nodePositions.set(
        n.id,
        new THREE.Vector3(
          ((i % columns) - (columns - 1) / 2) * 16,
          0,
          (Math.floor(i / columns) - (rows - 1) / 2) * 16,
        ),
      ),
    );
    const providerX = ((columns - 1) / 2) * 16 + 12;
    const extent = Math.max(
      12,
      columns * 9,
      rows * 9,
      props.data.providers.length ? providerX + 4 : 0,
      props.data.providers.length * 2.5,
    );
    orbit.maxDistance = extent * 6;
    let focusTarget: THREE.Vector3 | null = null;
    focus.current = (id) => {
      focusTarget = nodePositions.get(id)?.clone() || null;
    };
    orbit.addEventListener("start", () => {
      focusTarget = null;
    });
    const resetCamera = () => {
      focusTarget = null;
      const fit = Math.max(1, 1.35 / camera.aspect);
      camera.position.set(
        extent * 0.92 * fit + (props.data.providers.length ? 6 : 0),
        extent * 1.04 * fit,
        extent * 1.5 * fit,
      );
      orbit.target.set(props.data.providers.length ? 6 : 0, 0, 0);
      orbit.update();
    };
    reset.current = resetCamera;
    resetCamera();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(extent * 12, extent * 12),
      new THREE.MeshBasicMaterial({ color: "#102237" }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.28;
    group.add(floor);
    const grid = new THREE.GridHelper(
      extent * 8,
      Math.min(160, Math.round(extent * 4)),
      "#294765",
      "#1b314c",
    );
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    grid.position.y = -0.25;
    group.add(grid);
    function box(
      parent: THREE.Group,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string,
      metalness = 0.3,
    ) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.38 }),
      );
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }
    function sphere(
      parent: THREE.Group,
      x: number,
      y: number,
      z: number,
      r: number,
      color: string,
      sx = 1,
      sy = 1,
      sz = 1,
    ) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 24, 16),
        new THREE.MeshStandardMaterial({
          color,
          metalness: 0.25,
          roughness: 0.3,
        }),
      );
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
      return mesh;
    }
    function tag(
      id: string,
      text: string,
      point: THREE.Vector3,
      provider = false,
    ) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-label" + (provider ? " provider" : "");
      button.textContent = text;
      button.title = text;
      button.addEventListener("click", () =>
        provider
          ? current.current.onProvider(id)
          : current.current.onSelect(id),
      );
      container.appendChild(button);
      labels.push({ element: button, point, id, provider });
    }
    function selectable(model: THREE.Group, id: string, provider = false) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = provider ? { providerId: id } : { nodeId: id };
          interactive.push(child);
        }
      });
    }
    props.data.nodes.forEach((node) => {
      const position = nodePositions.get(node.id)!;
      const model = new THREE.Group();
      model.position.copy(position);
      group.add(model);
      models.push({ object: model, nodeId: node.id });
      // Cada modelo es una representación conceptual; su geometría no inventa activos.
      const platform = box(model, 0, 0, 0, 5.6, 0.22, 4.6, "#304b68");
      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(platform.geometry),
        new THREE.LineBasicMaterial({
          color: node.kind === "cloud" ? "#65d9f4" : "#6c91b6",
          transparent: true,
          opacity: 0.7,
        }),
      );
      platform.add(border);
      if (node.kind === "site") {
        box(model, -0.6, 1.65, 0, 2.1, 3.2, 2.25, "#9bafc5");
        box(model, 1.15, 1.04, 0.15, 1.4, 2.05, 2.55, "#6e8ba8");
        box(model, -0.6, 3.34, 0, 2.25, 0.18, 2.4, "#d8e5ef");
        box(model, -0.65, 3.56, 0, 0.9, 0.3, 0.85, "#506d89");
        box(model, -0.6, 0.28, 1.5, 1.4, 0.45, 0.6, "#dce5ed");
        for (let floor = 0; floor < 5; floor++)
          for (let col = 0; col < 4; col++) {
            const window = box(
              model,
              -1.34 + col * 0.49,
              0.65 + floor * 0.5,
              1.134,
              0.3,
              0.25,
              0.035,
              (floor + col) % 4 === 0 ? "#f6d39b" : "#67bdd6",
            );
            (window.material as THREE.MeshStandardMaterial).emissive.set(
              (floor + col) % 4 === 0 ? "#b27b32" : "#257e9c",
            );
            (window.material as THREE.MeshStandardMaterial).emissiveIntensity =
              0.35;
          }
        for (let floor = 0; floor < 5; floor++)
          for (let col = 0; col < 3; col++)
            box(
              model,
              -1.66,
              0.65 + floor * 0.5,
              -0.7 + col * 0.65,
              0.035,
              0.25,
              0.36,
              "#6ab0cb",
            );
        box(model, -0.6, 0.52, 1.195, 0.55, 0.88, 0.08, "#253e58");
        box(model, 1.25, 0.15, 1.85, 1.1, 0.05, 0.55, "#667f82");
        for (const x of [-2.1, 2.1]) {
          box(model, x, 0.5, -1.5, 0.1, 0.8, 0.1, "#655747");
          sphere(model, x, 1, -1.5, 0.47, "#3d827c", 1, 1.25, 1);
        }
      } else if (node.kind === "cloud") {
        box(model, 0, 0.4, 0, 3.8, 0.5, 2.8, "#314b69");
        for (let i = 0; i < 3; i++) {
          box(model, -1.18 + i * 1.18, 0.95, 0, 0.9, 0.75, 1.45, "#7796b8");
          for (let k = 0; k < 3; k++)
            box(
              model,
              -1.18 + i * 1.18,
              0.72 + k * 0.18,
              0.74,
              0.65,
              0.035,
              0.025,
              "#66e3ef",
            );
        }
        sphere(model, -1.2, 2.45, 0, 0.9, "#daedfa");
        sphere(model, 0, 2.85, 0, 1.18, "#edf7ff", 1, 1, 0.8);
        sphere(model, 1.18, 2.48, 0, 0.86, "#c7e6f5");
        sphere(model, 0, 2.12, 0.05, 1, "#dcedf8", 1.8, 0.52, 0.85);
      } else {
        box(model, 0, 0.8, 0, 2.2, 1.4, 1.8, "#65758b");
        box(model, 0, 1.6, 0, 2.4, 0.2, 2, "#95a7b9");
        for (let i = 0; i < 3; i++)
          box(model, 0, 0.45 + i * 0.35, 0.92, 1.6, 0.05, 0.02, "#e9bc74");
      }
      selectable(model, node.id);
      tag(
        node.id,
        node.name,
        position.clone().add(new THREE.Vector3(0, 4.4, 0)),
      );
      node.layers.forEach((layer, i) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(3.35 + i * 0.43, 0.027, 8, 140),
          new THREE.MeshBasicMaterial({
            color: layer.color,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(position);
        ring.position.y = 0.03 + i * 0.017;
        ring.scale.setScalar(0.001);
        ring.visible = false;
        ring.userData = { nodeId: node.id, layerId: layer.id };
        group.add(ring);
        interactive.push(ring);
        rings.push({ mesh: ring, nodeId: node.id, layerId: layer.id });
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(3.35 + i * 0.43, 0.1, 6, 100),
          new THREE.MeshBasicMaterial({
            color: layer.color,
            transparent: true,
            opacity: 0.06,
            depthWrite: false,
          }),
        );
        halo.userData = ring.userData;
        ring.add(halo);
      });
    });
    // VPNs are documented relationships, not live tunnel telemetry.
    (props.data.connections || [])
      .filter((connection) => connection.sourceLocationId)
      .forEach((connection, index) => {
        const source = nodePositions.get(connection.sourceLocationId!);
        const target = nodePositions.get(connection.targetLocationId);
        if (!source || !target) return;
        const midpoint = source.clone().add(target).multiplyScalar(0.5);
        midpoint.y = 3.5 + (index % 3) * 0.6;
        const curve = new THREE.QuadraticBezierCurve3(
          source.clone().add(new THREE.Vector3(0, 0.4, 0)),
          midpoint,
          target.clone().add(new THREE.Vector3(0, 0.4, 0)),
        );
        const material = new THREE.LineDashedMaterial({
          color:
            connection.status === "disabled"
              ? "#7e8c9e"
              : connection.status === "review"
                ? "#e7bd7a"
                : "#b7a2ff",
          dashSize: 0.4,
          gapSize: 0.18,
          transparent: true,
          opacity: connection.status === "disabled" ? 0.35 : 0.9,
        });
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)),
          material,
        );
        line.computeLineDistances();
        group.add(line);
      });

    props.data.providers.forEach((provider, i) => {
      const point = new THREE.Vector3(
        providerX,
        0,
        (i - (props.data.providers.length - 1) / 2) * 4.8,
      );
      const model = new THREE.Group();
      model.position.copy(point);
      group.add(model);
      box(model, 0, 0.1, 0, 2.3, 0.2, 2.3, "#4c4b55");
      for (let k = 0; k < 3; k++)
        box(model, 0, 0.48 + k * 0.43, 0, 1.5, 0.3, 1.3, "#a2a3b7");
      sphere(model, 0.85, 1.7, 0, 0.19, "#edc18c");
      selectable(model, provider.id, true);
      tag(
        provider.id,
        provider.title,
        point.clone().add(new THREE.Vector3(0, 2.6, 0)),
        true,
      );
      provider.locationIds.forEach((id) => {
        const target = nodePositions.get(id);
        if (!target) return;
        const middle = point.clone().add(target).multiplyScalar(0.5);
        middle.y = 2;
        const curve = new THREE.QuadraticBezierCurve3(
          point.clone().add(new THREE.Vector3(0, 0.3, 0)),
          middle,
          target.clone().add(new THREE.Vector3(0, 0.3, 0)),
        );
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(56)),
          new THREE.LineDashedMaterial({
            color: "#d6b17e",
            dashSize: 0.18,
            gapSize: 0.15,
            transparent: true,
            opacity: 0.5,
          }),
        );
        line.computeLineDistances();
        group.add(line);
      });
    });
    let previousWidth = container.clientWidth;
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (Math.abs(w - previousWidth) > 20) {
        resetCamera();
        focus.current?.(current.current.selectedId);
      }
      previousWidth = w;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let start = { x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      start = { x: e.clientX, y: e.clientY };
    };
    const hit = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        (-(e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(interactive).find((h) => {
        const obj = h.object;
        return (
          obj.visible &&
          (obj.userData.nodeId || obj.userData.providerId) &&
          (!obj.userData.layerId ||
            current.current.selectedId === obj.userData.nodeId)
        );
      });
    };
    const up = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) return;
      const result = hit(e);
      if (!result) return;
      const d = result.object.userData;
      if (d.providerId) current.current.onProvider(d.providerId);
      else if (d.layerId) current.current.onLayer(d.layerId);
      else current.current.onSelect(d.nodeId);
    };
    const move = (e: PointerEvent) => {
      renderer.domElement.style.cursor = hit(e) ? "pointer" : "grab";
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointermove", move);
    const lost = (e: Event) => {
      e.preventDefault();
      setFailure(
        "Se ha interrumpido la vista 3D. Puedes seguir consultando las capas desde el panel y recargar la vista.",
      );
      renderer.setAnimationLoop(null);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previous: number | undefined;
    renderer.setAnimationLoop((time) => {
      const dt =
        previous === undefined
          ? 0
          : THREE.MathUtils.clamp((time - previous) / 1000, 0, 0.05);
      previous = time;
      if (document.hidden) return;
      if (focusTarget && motion.matches) {
        const offset = camera.position
          .clone()
          .sub(orbit.target)
          .setLength(Math.max(23, 18 / camera.aspect));
        orbit.target.copy(focusTarget);
        camera.position.copy(orbit.target).add(offset);
        focusTarget = null;
      }
      if (focusTarget) {
        const delta = focusTarget
          .clone()
          .sub(orbit.target)
          .multiplyScalar(1 - Math.exp(-dt * 4));
        orbit.target.add(delta);
        camera.position.add(delta);
        const offset = camera.position.clone().sub(orbit.target);
        const focusDistance = Math.max(23, 18 / camera.aspect);
        const distance = THREE.MathUtils.damp(
          offset.length(),
          focusDistance,
          4,
          dt,
        );
        camera.position.copy(orbit.target).add(offset.setLength(distance));
        if (
          orbit.target.distanceTo(focusTarget) < 0.02 &&
          Math.abs(distance - focusDistance) < 0.05
        )
          focusTarget = null;
      }
      orbit.autoRotate =
        current.current.rotating && !motion.matches && !focusTarget;
      orbit.update(dt);
      rings.forEach(({ mesh, nodeId, layerId }) => {
        const target = current.current.selectedId === nodeId ? 1 : 0;
        const scale = motion.matches
          ? target
          : THREE.MathUtils.damp(mesh.scale.x, target, 6, dt);
        mesh.scale.setScalar(Math.max(0.001, scale));
        mesh.visible = scale > 0.015;
        (mesh.material as THREE.MeshBasicMaterial).opacity =
          layerId === current.current.layerId ? 0.98 : 0.48;
      });
      const bounds = container.getBoundingClientRect();
      labels.forEach((label) => {
        const p = label.point.clone().project(camera);
        label.element.style.transform = `translate(-50%,-50%) translate(${(p.x * 0.5 + 0.5) * bounds.width}px,${(-p.y * 0.5 + 0.5) * bounds.height}px)`;
        label.element.style.visibility =
          p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1
            ? "visible"
            : "hidden";
        label.element.classList.toggle(
          "active",
          label.id === current.current.selectedId,
        );
        label.element.setAttribute(
          "aria-pressed",
          String(label.id === current.current.selectedId),
        );
      });
      renderer.render(scene, camera);
    });
    return () => {
      reset.current = null;
      focus.current = null;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      orbit.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((m) => materials.add(m));
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      labels.forEach((l) => l.element.remove());
    };
  }, [props.data]);
  return (
    <div className="posture-canvas" ref={host}>
      {failure && (
        <div className="scene-fallback" role="status">
          <strong>Vista de infraestructura</strong>
          <p>{failure}</p>
        </div>
      )}
    </div>
  );
}
