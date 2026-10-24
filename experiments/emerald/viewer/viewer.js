if(new URLSearchParams(location.search).get('embed')==='portfolio')document.documentElement.classList.add('portfolio-embed');
import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {DRACOLoader} from './vendor/DRACOLoader.js';

const $ = id => document.getElementById(id);
const stage=$('stage'), range=$('shell-range'), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,controls,mixer,rotor,model,pmrem,env,decoder;
let ready=false,dirty=true,visible=true,frameId=0,last=0,opening=0,targetOpening=0,orbit=false,motor=false,motorAngle=0,duration=1,startTime=0;
let closedPosition,closedQuaternion;
const animations=[];
const homeTarget=new THREE.Vector3(0,1.0,-.2);
const homeDirection=new THREE.Vector3(7.8,3.1,10.9).normalize();
const bounds=new THREE.Box3();
let radius=3.25;

function ui(){
 range.value=String(Math.round(opening*100));$('shell-value').value=`${Math.round(opening*100)}%`;
 $('shell-toggle').textContent=targetOpening>.5?'Close shells':'Open shells';
 $('orbit').setAttribute('aria-pressed',String(orbit));$('orbit').lastElementChild.textContent=orbit?'Stop rotation':'Rotate view';
 $('motor').setAttribute('aria-pressed',String(motor));$('motor').lastElementChild.textContent=motor?'Stop motor':'Run motor';
 $('pause').disabled=!ready||(!orbit&&!motor&&Math.abs(opening-targetOpening)<.001);
}
function applyShell(value){
 opening=THREE.MathUtils.clamp(value,0,1);
 if(mixer){for(const action of animations){action.reset().play();}mixer.setTime(startTime+opening*(duration-startTime));}
 if(rotor)rotor.quaternion.copy(closedQuaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),motorAngle));
 dirty=true;ui();
}
function setShell(value,animate=true){
 targetOpening=THREE.MathUtils.clamp(value,0,1);
 if(!animate||reduced)applyShell(targetOpening);
 ui();wake();
}
function pause(){orbit=false;motor=false;targetOpening=opening;controls.autoRotate=false;ui();dirty=true;wake();}
function frameCamera(direction=homeDirection){
 const aspect=stage.clientWidth/stage.clientHeight;
 const vFov=THREE.MathUtils.degToRad(camera.fov),hFov=2*Math.atan(Math.tan(vFov/2)*aspect);
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
 const up=new THREE.Vector3().crossVectors(direction,right).normalize();
 let distance=4;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const p=new THREE.Vector3(x,y,z).sub(homeTarget);
  distance=Math.max(distance,p.dot(direction)+Math.max(Math.abs(p.dot(right))/(Math.tan(hFov/2)*.98),Math.abs(p.dot(up))/(Math.tan(vFov/2)*.98)));
 }
 controls.maxDistance=Math.max(24,distance*1.3);
 controls.target.copy(homeTarget);camera.position.copy(homeTarget).addScaledVector(direction,distance);
 camera.near=.05;camera.far=100;camera.updateProjectionMatrix();controls.update();dirty=true;
}
function reset(){
 if(!ready)return;pause();motorAngle=0;setShell(0,false);frameCamera();wake();
}
function resize(){
 if(!renderer)return;
 const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 // Reframe only when the layout changes, keeping normal orbit/zoom user-controlled.
 if(ready)frameCamera(camera.position.clone().sub(controls.target).normalize());
 dirty=true;wake();
}
function wake(){if(!frameId&&visible&&!document.hidden)frameId=requestAnimationFrame(tick);}
function tick(now){
 frameId=0;if(!visible||document.hidden){last=0;return;}
 const dt=last?Math.min((now-last)/1000,.05):0;last=now;
 let moving=false;
 if(ready){
  if(Math.abs(targetOpening-opening)>.0001){
   const delta=targetOpening-opening;applyShell(opening+Math.sign(delta)*Math.min(Math.abs(delta),dt/1.8));moving=true;
  }
  if(motor){motorAngle=(motorAngle+dt*1.2)%(Math.PI*2);rotor.quaternion.copy(closedQuaternion).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),motorAngle));moving=true;}
  controls.autoRotate=orbit;moving=controls.update(dt)||moving;
 }
 if(dirty||moving){renderer.render(scene,camera);dirty=false;}
 if(moving||orbit||motor||Math.abs(targetOpening-opening)>.0001)wake();else last=0;
}
function fail(error){
 console.error('Beetle viewer:',error);ready=false;$('loading').hidden=true;$('error').hidden=false;
 $('poster').classList.remove('loaded');$('error-detail').textContent=error?.message?.includes('WebGL')?'This browser could not start 3D graphics. The studio image is still available.':'Check your connection, then try loading the model again.';
 for(const id of ['shell-toggle','shell-range','orbit','motor','pause'])$(id).disabled=true;
}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
  stage.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();fail(new Error('WebGL context lost'));});
  scene=new THREE.Scene();scene.background=new THREE.Color('#17171b');scene.fog=new THREE.FogExp2('#17171b',.035);
  camera=new THREE.PerspectiveCamera(34,1,.05,100);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;
  controls.minDistance=4.3;controls.maxDistance=24;controls.maxPolarAngle=Math.PI/2-.025;controls.minPolarAngle=.03;controls.autoRotateSpeed=.65;
  controls.addEventListener('change',()=>{dirty=true;wake();});
  controls.addEventListener('start',()=>{orbit=false;ui();wake();});
  // Broad photographic softboxes create readable reflections on the existing PBR finish.
  // This environment is baked once; the interactive scene keeps rendering on demand.
  const studio=new THREE.Scene();studio.background=new THREE.Color(.035,.04,.045);
  const softbox=(position,width,height,color,strength)=>{
   const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(strength),side:THREE.DoubleSide});
   const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
   panel.position.set(...position);panel.lookAt(0,1,0);studio.add(panel);
  };
  softbox([-5,7,5],5,7,0xffe1bb,5);
  softbox([5,4,-5],2,7,0xc4ddff,7);
  softbox([0,9,0],5,3,0xffffff,4);
  softbox([4,5,7],3,6,0xffedda,4);
  softbox([-6,4,8],5,6,0xe0e8ef,3);
  pmrem=new THREE.PMREMGenerator(renderer);env=pmrem.fromScene(studio,.06);scene.environment=env.texture;scene.environmentIntensity=.95;
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xc8d9e6,0x141414,.35));
  const key=new THREE.DirectionalLight(0xffdfb6,2.15);key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.camera.near=.5;key.shadow.camera.far=25;key.shadow.normalBias=.012;key.shadow.bias=-.0001;key.shadow.radius=16;key.shadow.blurSamples=16;scene.add(key);
  const rim=new THREE.DirectionalLight(0xa7caff,5.2);rim.position.set(5,4,-5);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xe4eeff,.45);fill.position.set(1,4,8);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x090a0d,roughness:.85,metalness:0,envMapIntensity:.025}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
  decoder=new DRACOLoader();decoder.setDecoderPath(new URL('./vendor/draco/',import.meta.url).href);decoder.setWorkerLimit(2);
  const loader=new GLTFLoader().setDRACOLoader(decoder);
  const gltf=await loader.loadAsync(new URL('./assets/beetle.glb?v=film-hinges-2',import.meta.url).href,event=>{if(event.total)$('loading').textContent=`Loading model · ${Math.round(event.loaded/event.total*100)}%`;});
  model=gltf.scene;scene.add(model);rotor=model.getObjectByName('Motor_Rotor');
  if(!rotor||!gltf.animations.length)throw new Error('Model is missing its moving assemblies.');
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.envMapIntensity=1.1;
    if(m.name.includes('emerald')){
     m.clearcoat=.42;m.clearcoatRoughness=.17;
     m.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vFlakePosition;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFlakePosition = position;');
      shader.fragmentShader='varying vec3 vFlakePosition;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
       vec3 cell=floor(vFlakePosition*420.0);
       float grain=fract(sin(dot(cell,vec3(12.9898,78.233,39.425)))*43758.5453);
       float filterWeight=1.0-smoothstep(.3,1.0,length(fwidth(vFlakePosition*420.0)));
       roughnessFactor+= (grain-.5)*.035*filterWeight;`);
     };m.customProgramCacheKey=()=> 'emerald-film-flake-v1';
    }
    if(m.name.includes('Warm ivory optics')){m.color.setRGB(.65,.18,.018);m.emissive.setRGB(1,.23,.025);m.emissiveIntensity=3;}
}}});
  closedQuaternion=rotor.quaternion.clone();closedPosition=rotor.position.clone();
  mixer=new THREE.AnimationMixer(model);
  for(const clip of gltf.animations){const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();animations.push(action);}
  duration=Math.max(...gltf.animations.map(a=>a.duration));startTime=Math.min(...gltf.animations.flatMap(a=>a.tracks.map(t=>t.times[0])));
  // Fit both states, so opening never clips the shell rims.
  mixer.setTime(duration);model.updateMatrixWorld(true);bounds.setFromObject(model);radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;
  mixer.setTime(startTime);ready=true;applyShell(0);resize();frameCamera();
  for(const id of ['shell-toggle','shell-range','orbit','motor'])$(id).disabled=false;
  $('loading').hidden=true;$('poster').classList.add('loaded');ui();dirty=true;wake();
  decoder.dispose();
 }catch(error){fail(error);}
}
$('shell-toggle').addEventListener('click',()=>setShell(targetOpening>.5?0:1));
range.addEventListener('input',()=>setShell(Number(range.value)/100,false));
$('orbit').addEventListener('click',()=>{orbit=!orbit;ui();wake();});
$('motor').addEventListener('click',()=>{motor=!motor;if(motor&&targetOpening<.75)setShell(1);ui();wake();});
$('pause').addEventListener('click',pause);$('reset').addEventListener('click',reset);
$('hero').addEventListener('click',()=>{if(ready){frameCamera();wake();}});
$('top').addEventListener('click',()=>{if(ready){frameCamera(new THREE.Vector3(0,1,.001).normalize());wake();}});
$('retry').addEventListener('click',()=>location.reload());
stage.addEventListener('keydown',e=>{
 if(!ready)return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','=','Home',' '].includes(e.key))e.preventDefault();else return;
 if(e.key==='Home'){reset();return;}if(e.key===' '){pause();return;}
 const delta=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(delta);
 if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;
 if(e.key==='ArrowUp')s.phi-=.10;if(e.key==='ArrowDown')s.phi+=.10;
 if(e.key==='+'||e.key==='=')s.radius*=.9;if(e.key==='-')s.radius*=1.1;
 s.phi=THREE.MathUtils.clamp(s.phi,.03,Math.PI/2-.025);s.radius=THREE.MathUtils.clamp(s.radius,controls.minDistance,controls.maxDistance);
 camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();dirty=true;wake();
});
new ResizeObserver(resize).observe(stage);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){dirty=true;wake();}else{last=0;}}).observe(stage);
document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)wake();});
window.addEventListener('pagehide',event=>{
 if(frameId)cancelAnimationFrame(frameId);frameId=0;last=0;
 if(event.persisted)return;
 controls?.dispose();renderer?.dispose();env?.dispose();model?.traverse(o=>{o.geometry?.dispose();const materials=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];materials.forEach(m=>m.dispose());});
});
window.addEventListener('pageshow',event=>{if(event.persisted){last=0;dirty=true;wake();}});
// Small read-only diagnostic surface for the packaged viewer's smoke checks.
window.beetleViewer={snapshot:()=>({ready,opening,targetOpening,orbit,motor,motorAngle,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,camera:camera?.position.toArray(),rotor:rotor?.quaternion.toArray(),shell:model?.getObjectByName('Shell_Left')?.position.toArray()})};
init();
