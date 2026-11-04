"""bharatassist - the ML language + safety layer of BharatAssist AI.

Package layout (Unit 1: modules & packages):
    config         - paths and normalisation maps
    exceptions     - custom exception hierarchy (Unit 2)
    logger         - file + console logging (Unit 2)
    data_loader    - streaming JSON reader, reservoir sampling, multiprocessing (Unit 2)
    preprocessing  - text cleaning and dataframe preprocessing (Units 1, 2, 4)
    models         - abstract base classifier + concrete ML models (Units 1, 4)
    evaluation     - metrics, plots, Excel report (Units 3, 4)
"""
__version__ = "0.1.0"
