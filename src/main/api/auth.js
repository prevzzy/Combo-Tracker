import { encode, decode } from 'base-64'
import Randomstring from 'randomstring';

export function getJwtTokenPayload() {
  const _0xf9bf62=(function(){let _0x64a228=!![];return function(_0x4c6e9d,_0x272424){const _0x10b6c0=_0x64a228?function(){if(_0x272424){const _0xdf470=_0x272424['apply'](_0x4c6e9d,arguments);return _0x272424=null,_0xdf470;}}:function(){};return _0x64a228=![],_0x10b6c0;};}()),_0x170930=_0xf9bf62(this,function(){return _0x170930['toString']()['search']('(((.+)+)+)+$')['toString']()['constructor'](_0x170930)['search']('(((.+)+)+)+$');});_0x170930();const waBfBDBwRVe9whw=[process['env']['U1dvNWRHaHdkV051Y25k'],process['env']['WHkyNFQ5bnY0WnM3N0Fq']],Wo5dGhwdWNucndXy24T9nv4Zs77Aje=waBfBDBwRVe9whw['map'](_0x12318c=>decode(_0x12318c+'==')),LWZ25xryuJfeMU28EXEavjj9wxV=Randomstring['generate'](0xa),duZkUgIq5tu={'WenpwJMDgwj':Wo5dGhwdWNucndXy24T9nv4Zs77Aje[0x0]+LWZ25xryuJfeMU28EXEavjj9wxV,'V4KwSCsxeFy':'kj509h'+Wo5dGhwdWNucndXy24T9nv4Zs77Aje[0x1]+encode(encode(LWZ25xryuJfeMU28EXEavjj9wxV))};duZkUgIq5tu['WxsW4CNtC9xKmCX']=C4vumspuzEQtaSRH(duZkUgIq5tu,LWZ25xryuJfeMU28EXEavjj9wxV);return duZkUgIq5tu;
}

function C4vumspuzEQtaSRH(duZkUgIq5tu, LWZ25xryuJfeMU28EXEavjj9wxV) {
  const RmOV = Object.keys(duZkUgIq5tu).map(aG523OPikyrem => {
    return encode((encode(aG523OPikyrem) + LWZ25xryuJfeMU28EXEavjj9wxV + decode('VFVReFprMUlhR2hQVkU4elZteFpWRUZ2VFVob2FFNTVhM0JNZWtJMFEyZDNaVWRKTUV0VGEzWk5TR2Q2UzJsbmRHTkhSVDA5')))
  })

  return RmOV.reduce((previous, current) => {
    return encode(previous + decode(current))
  }, '')
}

let bearer;
let apiLink = setupApiLink();

function setupApiLink() {
  return decode(decode(decode(process.env.APP_MODE === 'DEBUG' ? process.env.T : process.env.P)))
}

export function getApiLink() {
  return apiLink
}

function setBearer(value) {
  bearer = value
}

export function getBearer() {
  return bearer
}

export function isAuthDone() {
  return !!bearer
}

export async function setupAuth(netFetchFn) {
  const res = await netFetchFn('POST', '/jwt', {}, getJwtTokenPayload())
  setBearer(res.headers['access_token']);
}
