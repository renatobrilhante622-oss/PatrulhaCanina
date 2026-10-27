#!/usr/bin/env python3
"""Instala ferramentas oficiais com checksum publicado pelo Android SDK Manager."""
from pathlib import Path
import hashlib
import os
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

sdk=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/patrulha-android-sdk').resolve()
sdk.mkdir(parents=True,exist_ok=True)
manager=sdk/'cmdline-tools/19.0/bin/sdkmanager'
if not manager.exists():
 xml=ET.parse('/tmp/android-repository.xml').getroot() if Path('/tmp/android-repository.xml').exists() else ET.fromstring(urllib.request.urlopen('https://dl.google.com/android/repository/repository2-1.xml').read())
 package=next(e for e in xml if e.tag.endswith('remotePackage') and e.attrib.get('path')=='cmdline-tools;19.0')
 archive=next(e for e in package.findall('./archives/archive') if e.findtext('host-os')=='linux')
 url=archive.findtext('./complete/url'); checksum=archive.find('./complete/checksum')
 data=urllib.request.urlopen('https://dl.google.com/android/repository/'+url).read()
 assert hashlib.new(checksum.attrib.get('type','sha1'),data).hexdigest()==checksum.text.strip()
 download=sdk/'tools.zip'; download.write_bytes(data)
 with zipfile.ZipFile(download) as z: z.extractall(sdk/'unpack')
 (sdk/'cmdline-tools').mkdir(exist_ok=True)
 (sdk/'unpack/cmdline-tools').rename(sdk/'cmdline-tools/19.0')
 for path in (sdk/'cmdline-tools/19.0/bin').iterdir(): path.chmod(0o755)
 download.unlink()
env=os.environ.copy(); env['ANDROID_HOME']=str(sdk); env['ANDROID_USER_HOME']=str(sdk/'user'); env['ANDROID_PREFS_ROOT']=str(sdk/'prefs')
subprocess.run([str(manager),'--sdk_root='+str(sdk),'--licenses'],input='y\n'*100,text=True,env=env,check=True)
subprocess.run([str(manager),'--sdk_root='+str(sdk),'platform-tools','platforms;android-35','build-tools;35.0.0'],env=env,check=True)
print('SDK pronto em',sdk)
