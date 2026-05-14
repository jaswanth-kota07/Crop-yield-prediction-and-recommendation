import joblib
import traceback
try:
    joblib.load('models/crop_model_v1.pkl')
    print('✅ Loaded')
except Exception as e:
    print('Error loading:')
    print(traceback.format_exc())
