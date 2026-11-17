from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
out=Path('tmp/pdfs'); out.mkdir(parents=True,exist_ok=True)
font=lambda size,bold=False: ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf',size)
for kind in range(3):
 im=Image.new('RGB',(360,460),'#FFFFFF'); d=ImageDraw.Draw(im)
 if kind==0:
  d.rounded_rectangle((83,80,277,427),radius=48,fill='#F2C6CF',outline='#E8A8B5',width=3)
  d.rounded_rectangle((129,35,231,99),radius=12,fill='#7C87A5')
  d.rounded_rectangle((92,187,268,353),radius=13,fill='#FFF9F8')
  d.text((128,207),'DEMO',font=font(21,True),fill='#A56878')
  d.text((113,246),'HIDRA',font=font(39,True),fill='#713C57')
  d.text((128,291),'FRESA',font=font(24,True),fill='#B96D82')
  d.text((142,385),'625 ml',font=font(20),fill='#713C57')
 elif kind==1:
  d.rounded_rectangle((40,105,320,365),radius=8,fill='#E9F3EC',outline='#9DB9AA',width=3)
  d.rectangle((41,105,319,160),fill='#6D9481')
  d.text((75,121),'DEMO',font=font(25,True),fill='white')
  d.text((64,198),'RESPIRA',font=font(43,True),fill='#3D6552')
  d.text((67,253),'DIA',font=font(28,True),fill='#5F816F')
  d.text((66,315),'24 capsulas',font=font(21),fill='#3D6552')
 else:
  d.polygon([(80,45),(280,45),(256,385),(104,385)],fill='#E5DCEF',outline='#BAA6CC',width=3)
  d.rounded_rectangle((104,365,256,427),radius=8,fill='#9075AB')
  d.text((142,93),'DEMO',font=font(21,True),fill='#8E75A4')
  d.text((112,160),'SOLAR',font=font(37,True),fill='#614979')
  d.text((143,222),'50+',font=font(46,True),fill='#614979')
  d.text((129,308),'DIARIO',font=font(23,True),fill='#8E75A4')
 im.save(out/f'demo-package-{kind}.jpg',quality=95)
