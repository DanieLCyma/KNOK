from django.apps import AppConfig
import torch
import torchaudio
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
from zonos.utils import DEFAULT_DEVICE as device
import os
from django.conf import settings

class MyappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp'

    def ready(self):
        from django.core.cache import cache  # 같은 작업 중복 방지용
        if not cache.get('model_warmed_up'):
            try:
                print("Warming up Zonos model...")

                model = Zonos.from_pretrained("Zyphra/Zonos-v0.1-hybrid", device=device)

                audio_path = os.path.join(settings.BASE_DIR, "cloning_sample.wav")
                speaker_wav, sampling_rate = torchaudio.load(audio_path)
                speaker = model.make_speaker_embedding(speaker_wav, sampling_rate)

                dummy_text = "안녕하세요. 시스템을 초기화 중입니다."

                cond_dict = make_cond_dict(
                    text=dummy_text,
                    speaker=speaker,
                    language="ko",
                    emotion=[0.0] * 7 + [1.0],
                    speaking_rate=23.0,
                    pitch_std=20.0,
                )
                conditioning = model.prepare_conditioning(cond_dict)
                codes = model.generate(conditioning)
                _ = model.autoencoder.decode(codes).cpu()

                print("Zonos model warmed up successfully.")
                cache.set('model_warmed_up', True, timeout=None)
            except Exception as e:
                print("Warm-up failed:", e)